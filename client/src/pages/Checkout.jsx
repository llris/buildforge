import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  MapPin,
  Truck,
  CheckCircle2,
  CreditCard,
  ShieldCheck,
  Plus,
  ArrowRight,
  ArrowLeft,
  Tag,
  X,
  AlertCircle,
} from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';

// Helper to dynamically load Razorpay checkout script
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function Checkout() {
  const { user } = useAuth();
  const { items, itemCount, subtotal, discountAmount, appliedCoupon, applyCoupon, removeCoupon } = useCart();
  const navigate = useNavigate();

  // Stepper state: 1: Address, 2: Shipping, 3: Review & Payment
  const [currentStep, setCurrentStep] = useState(1);

  // Address state
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    street: '',
    city: '',
    state: '',
    zip: '',
    country: 'US',
  });

  // Shipping methods state
  const [shippingZones, setShippingZones] = useState([]);
  const [selectedZoneId, setSelectedZoneId] = useState(null);

  // Promo code in checkout
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  // Payment & Idempotency state
  const [idempotencyKey, setIdempotencyKey] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');

  // Initial load
  useEffect(() => {
    if (!user) {
      navigate('/login?redirect=/checkout');
      return;
    }

    if (items.length === 0) {
      navigate('/cart');
      return;
    }

    // Generate unique idempotency key for this checkout attempt
    setIdempotencyKey(`chk_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`);

    // Fetch user addresses
    api
      .get('/addresses')
      .then((res) => {
        const list = res.data.data || [];
        setAddresses(list);
        if (list.length > 0) {
          const defaultAddr = list.find((a) => a.isDefault) || list[0];
          setSelectedAddressId(defaultAddr.id);
        } else {
          setShowNewAddressForm(true);
        }
      })
      .catch((err) => console.error('Failed to load addresses:', err));

    // Fetch shipping zones
    api
      .get('/addresses/shipping-zones')
      .then((res) => {
        const zones = res.data.data || [];
        setShippingZones(zones);
        if (zones.length > 0) {
          setSelectedZoneId(zones[0].id);
        }
      })
      .catch((err) => console.error('Failed to load shipping zones:', err));
  }, [user, items.length, navigate]);

  // Selected shipping zone details
  const selectedZone = shippingZones.find((z) => z.id === selectedZoneId) || shippingZones[0];
  const shippingFee = selectedZone ? selectedZone.fee : 15.0;

  // Selected address details
  const selectedAddress =
    addresses.find((a) => a.id === selectedAddressId) ||
    (showNewAddressForm ? newAddress : null);

  // Financial calculations
  const effectiveDiscount = discountAmount || 0;
  const taxableSubtotal = Math.max(0, subtotal - effectiveDiscount);
  const estimatedTax = Math.round(taxableSubtotal * 0.075 * 100) / 100;
  const estimatedTotal = Math.round((taxableSubtotal + estimatedTax + shippingFee) * 100) / 100;

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    setCouponError('');
    const res = await applyCoupon(couponInput.trim());
    setCouponLoading(false);
    if (res.success) {
      setCouponInput('');
    } else {
      setCouponError(res.error || 'Failed to apply coupon');
    }
  };

  const handleAddNewAddress = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/addresses', newAddress);
      const created = res.data.data;
      setAddresses([created, ...addresses]);
      setSelectedAddressId(created.id);
      setShowNewAddressForm(false);
      setNewAddress({ street: '', city: '', state: '', zip: '', country: 'US' });
    } catch (err) {
      setCheckoutError(err.response?.data?.error?.message || 'Failed to save address');
    }
  };

  // Launch Razorpay Checkout Modal
  const handlePay = async () => {
    setIsProcessing(true);
    setCheckoutError('');

    try {
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        throw new Error('Razorpay SDK failed to load. Please check your internet connection.');
      }

      // Step 1: Initiate server checkout and reserve inventory
      const payload = {
        addressId: selectedAddressId || undefined,
        newAddress: !selectedAddressId ? newAddress : undefined,
        shippingZoneId: selectedZoneId,
        couponCode: appliedCoupon?.code,
        idempotencyKey,
      };

      const checkoutRes = await api.post('/orders/checkout', payload, {
        headers: { 'Idempotency-Key': idempotencyKey },
      });

      const orderData = checkoutRes.data.data;

      // Step 2: Configure Razorpay modal
      const options = {
        key: orderData.keyId,
        amount: Math.round(orderData.total * 100),
        currency: orderData.currency || 'USD',
        name: 'BuildForge Inc.',
        description: `Order #${orderData.orderId.slice(0, 8).toUpperCase()}`,
        image: 'https://placehold.co/100x100?text=BuildForge',
        order_id: orderData.razorpayOrderId,
        prefill: {
          email: user?.email,
        },
        theme: {
          color: '#2563eb',
        },
        handler: async function (response) {
          try {
            // Step 3: Verify signature on server
            const verifyRes = await api.post('/orders/verify-payment', {
              orderId: orderData.orderId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });

            if (verifyRes.data.success) {
              navigate(`/order-confirmation/${orderData.orderId}`);
            }
          } catch (verifyErr) {
            setCheckoutError(
              verifyErr.response?.data?.error?.message ||
                'Payment verification failed. Please contact support.'
            );
            setIsProcessing(false);
          }
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (resp) {
        setCheckoutError(resp.error.description || 'Payment was declined');
        setIsProcessing(false);
      });

      rzp.open();
    } catch (err) {
      console.error('Checkout error:', err);
      setCheckoutError(
        err.response?.data?.error?.message || err.message || 'Failed to initiate checkout'
      );
      setIsProcessing(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      {/* Checkout Progress Stepper */}
      <div className="mb-10 max-w-2xl mx-auto">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 w-full bg-gray-200 -z-10" />

          {/* Step 1 */}
          <button
            onClick={() => currentStep > 1 && setCurrentStep(1)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-xs transition ${
              currentStep >= 1 ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-400'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>1. Address</span>
          </button>

          {/* Step 2 */}
          <button
            onClick={() => currentStep > 2 && setCurrentStep(2)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-xs transition ${
              currentStep >= 2 ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-500'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>2. Shipping</span>
          </button>

          {/* Step 3 */}
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-xs transition ${
              currentStep === 3 ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-500'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>3. Review & Pay</span>
          </div>
        </div>
      </div>

      {checkoutError && (
        <div className="mb-8 rounded-2xl bg-red-50 border border-red-200 p-4 flex items-start gap-3 text-sm text-red-700">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
          <div>
            <p className="font-bold">Checkout Notice</p>
            <p>{checkoutError}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Main Step Content */}
        <div className="lg:col-span-8">
          {/* STEP 1: DELIVERY ADDRESS */}
          {currentStep === 1 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-6 animate-fade-in">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Delivery Address</h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Select where you would like your components delivered
                  </p>
                </div>
                {!showNewAddressForm && (
                  <button
                    onClick={() => setShowNewAddressForm(true)}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    New Address
                  </button>
                )}
              </div>

              {/* Saved Addresses List */}
              {!showNewAddressForm && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {addresses.map((addr) => {
                    const isSelected = selectedAddressId === addr.id;
                    return (
                      <div
                        key={addr.id}
                        onClick={() => setSelectedAddressId(addr.id)}
                        className={`cursor-pointer rounded-xl p-4 border transition flex flex-col justify-between ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/50 shadow-sm ring-2 ring-blue-500/20'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <MapPin
                              className={`w-4 h-4 ${
                                isSelected ? 'text-blue-600' : 'text-gray-400'
                              }`}
                            />
                            <span className="text-xs font-bold text-gray-900">
                              {addr.city}, {addr.state}
                            </span>
                          </div>
                          {addr.isDefault && (
                            <span className="text-[10px] uppercase font-extrabold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                          {addr.street}
                          <br />
                          {addr.city}, {addr.state} {addr.zip}
                          <br />
                          {addr.country}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* New Address Form */}
              {showNewAddressForm && (
                <form onSubmit={handleAddNewAddress} className="space-y-4 pt-2">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                      Street Address
                    </label>
                    <input
                      type="text"
                      required
                      value={newAddress.street}
                      onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                      placeholder="e.g. 742 Evergreen Terrace"
                      className="w-full text-sm border border-gray-300 rounded-xl px-3 py-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                        City
                      </label>
                      <input
                        type="text"
                        required
                        value={newAddress.city}
                        onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                        placeholder="Springfield"
                        className="w-full text-sm border border-gray-300 rounded-xl px-3 py-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                        State / Province
                      </label>
                      <input
                        type="text"
                        required
                        value={newAddress.state}
                        onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                        placeholder="OR"
                        className="w-full text-sm border border-gray-300 rounded-xl px-3 py-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                        ZIP / Postal
                      </label>
                      <input
                        type="text"
                        required
                        value={newAddress.zip}
                        onChange={(e) => setNewAddress({ ...newAddress, zip: e.target.value })}
                        placeholder="97477"
                        className="w-full text-sm border border-gray-300 rounded-xl px-3 py-2 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    {addresses.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowNewAddressForm(false)}
                        className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="submit"
                      className="px-6 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow hover:bg-blue-700 transition"
                    >
                      Save Address
                    </button>
                  </div>
                </form>
              )}

              {/* Step 1 Actions */}
              <div className="pt-6 border-t border-gray-100 flex justify-end">
                <button
                  disabled={!selectedAddressId && !showNewAddressForm}
                  onClick={() => setCurrentStep(2)}
                  className="px-8 py-3 rounded-xl bg-blue-600 text-white font-bold text-sm shadow-md hover:bg-blue-700 disabled:opacity-50 transition flex items-center gap-2"
                >
                  <span>Continue to Shipping</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: SHIPPING METHOD */}
          {currentStep === 2 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-6 animate-fade-in">
              <div className="border-b border-gray-100 pb-4">
                <h2 className="text-xl font-bold text-gray-900">Shipping Method</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Select your preferred delivery speed and courier option
                </p>
              </div>

              <div className="space-y-3">
                {shippingZones.map((zone) => {
                  const isSelected = selectedZoneId === zone.id;
                  return (
                    <div
                      key={zone.id}
                      onClick={() => setSelectedZoneId(zone.id)}
                      className={`cursor-pointer rounded-xl p-4 border transition flex items-center justify-between ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/50 shadow-sm ring-2 ring-blue-500/20'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected ? 'border-blue-600 bg-blue-600' : 'border-gray-300 bg-white'
                          }`}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">
                            {zone.region} Priority Ground
                          </p>
                          <p className="text-xs text-gray-500">
                            Estimated Delivery: {zone.estimatedDays} Business Days
                          </p>
                        </div>
                      </div>
                      <span className="text-base font-extrabold text-gray-900">
                        ${zone.fee.toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-900 transition flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back
                </button>
                <button
                  onClick={() => setCurrentStep(3)}
                  className="px-8 py-3 rounded-xl bg-blue-600 text-white font-bold text-sm shadow-md hover:bg-blue-700 transition flex items-center gap-2"
                >
                  <span>Review Order</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: ORDER REVIEW & PAY */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-fade-in">
              {/* Delivery & Shipping Info Card */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500">
                    Delivery & Logistics
                  </h3>
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="text-xs font-bold text-blue-600 hover:underline"
                  >
                    Change
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-gray-600">
                  <div>
                    <span className="font-bold text-gray-900 block mb-1">Ship To:</span>
                    <p>
                      {selectedAddress?.street}
                      <br />
                      {selectedAddress?.city}, {selectedAddress?.state} {selectedAddress?.zip}
                      <br />
                      {selectedAddress?.country}
                    </p>
                  </div>
                  <div>
                    <span className="font-bold text-gray-900 block mb-1">Shipping Method:</span>
                    <p>
                      {selectedZone?.region} Priority ({selectedZone?.estimatedDays} Business Days)
                      <br />
                      Carrier: DHL / FedEx Tracked
                    </p>
                  </div>
                </div>
              </div>

              {/* Items Card */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 border-b border-gray-100 pb-3">
                  Items Snapshot ({itemCount})
                </h3>
                <div className="divide-y divide-gray-100">
                  {items.map((item) => {
                    const prod = item.product || {};
                    return (
                      <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={prod.images?.[0] || 'https://placehold.co/80x80?text=No+Img'}
                            alt={prod.name}
                            className="w-12 h-12 rounded-lg bg-gray-50 p-1 border object-contain"
                          />
                          <div>
                            <p className="text-xs font-bold text-gray-900 line-clamp-1">{prod.name}</p>
                            <p className="text-[11px] text-gray-500">
                              Qty: {item.qty} &times; ${item.unitPrice.toFixed(2)}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-extrabold text-gray-900">
                          ${item.lineTotal.toFixed(2)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Order Summary & Pay Card */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm sticky top-6 space-y-6">
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">
              Order Summary
            </h2>

            {/* Financial Breakdown */}
            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal ({itemCount} items)</span>
                <span className="font-semibold text-gray-900">${subtotal.toFixed(2)}</span>
              </div>

              {appliedCoupon && (
                <div className="flex justify-between text-emerald-600 font-semibold bg-emerald-50 p-2 rounded-lg">
                  <span>Coupon ({appliedCoupon.code})</span>
                  <span>-${effectiveDiscount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-gray-600">
                <span>Shipping Fee</span>
                <span className="font-semibold text-gray-900">${shippingFee.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-gray-600">
                <span>Estimated Sales Tax (7.5%)</span>
                <span className="font-semibold text-gray-900">${estimatedTax.toFixed(2)}</span>
              </div>

              <div className="border-t border-gray-200 pt-3 flex justify-between items-baseline">
                <span className="text-sm font-bold text-gray-900">Final Total</span>
                <span className="text-2xl font-extrabold text-blue-600">
                  ${estimatedTotal.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Promo Code Box */}
            <form onSubmit={handleApplyCoupon} className="pt-2 border-t border-gray-100 space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => {
                    setCouponInput(e.target.value);
                    if (couponError) setCouponError('');
                  }}
                  placeholder="PROMO CODE"
                  className="flex-1 text-xs bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 font-mono uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={couponLoading || !couponInput.trim()}
                  className="px-3 py-2 bg-gray-900 text-white text-xs font-bold rounded-lg hover:bg-gray-800 disabled:opacity-50 transition"
                >
                  {couponLoading ? '...' : 'Apply'}
                </button>
              </div>
              {couponError && <p className="text-[11px] text-red-600 font-medium">{couponError}</p>}
            </form>

            {/* Pay Button */}
            <button
              onClick={handlePay}
              disabled={isProcessing}
              className="w-full py-3.5 rounded-xl bg-blue-600 text-white font-bold text-sm shadow-md hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              <span>{isProcessing ? 'Processing Order...' : `Pay $${estimatedTotal.toFixed(2)}`}</span>
            </button>

            {/* Security Guarantee */}
            <div className="text-center pt-2">
              <p className="text-[11px] text-gray-400">
                Test Mode &bull; 256-bit Encrypted SSL &bull; Razorpay Secure
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
