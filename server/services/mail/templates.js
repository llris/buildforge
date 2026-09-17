const { env } = require('../../config/env');

const layout = (title, content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f5f7; margin: 0; padding: 0; color: #1e293b; }
    .container { max-width: 600px; margin: 30px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0; }
    .header { background-color: #0f172a; padding: 28px; text-align: center; }
    .logo { color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; text-decoration: none; }
    .logo span { color: #3b82f6; }
    .content { padding: 32px; }
    .footer { background-color: #f8fafc; padding: 24px 32px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #f1f5f9; }
    .button { display: inline-block; padding: 12px 28px; background-color: #2563eb; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px; margin: 20px 0; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
    .badge-blue { background-color: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; }
    .badge-green { background-color: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; }
    .badge-amber { background-color: #fffbeb; color: #b45309; border: 1px solid #fde68a; }
    .card { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 20px 0; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    th { background-color: #f8fafc; text-align: left; padding: 10px; font-size: 12px; font-weight: 700; color: #475569; border-bottom: 1px solid #e2e8f0; }
    td { padding: 12px 10px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <a href="${env.CLIENT_URL}" class="logo">Build<span>Forge</span></a>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p style="margin: 0 0 8px 0;">BuildForge Custom PC Hardware & Components</p>
      <p style="margin: 0;">If you have any questions, reach out to <a href="mailto:support@buildforge.in" style="color: #2563eb;">support@buildforge.in</a>.</p>
    </div>
  </div>
</body>
</html>
`;

const verifyEmail = (data) =>
  layout(
    'Verify Your Email - BuildForge',
    `
    <h2 style="margin-top: 0; font-size: 20px; font-weight: 800; color: #0f172a;">Welcome to BuildForge!</h2>
    <p style="font-size: 14px; line-height: 1.6; color: #475569;">Thank you for creating an account. Please verify your email address to unlock custom rig configurations and order tracking:</p>
    <div style="text-align: center;">
      <a href="${env.CLIENT_URL}/verify-email?token=${data.token}" class="button">Verify Email Address</a>
    </div>
    <p style="font-size: 12px; color: #94a3b8;">If you did not sign up for an account on BuildForge, you can safely ignore this email.</p>
  `
  );

const resetPassword = (data) =>
  layout(
    'Reset Your Password - BuildForge',
    `
    <h2 style="margin-top: 0; font-size: 20px; font-weight: 800; color: #0f172a;">Password Reset Request</h2>
    <p style="font-size: 14px; line-height: 1.6; color: #475569;">We received a request to reset your BuildForge account password. Click below to create a new password:</p>
    <div style="text-align: center;">
      <a href="${env.CLIENT_URL}/reset-password?token=${data.token}" class="button" style="background-color: #dc2626;">Reset Password</a>
    </div>
    <p style="font-size: 12px; color: #94a3b8;">This security link is valid for 15 minutes. If you did not request a password reset, please secure your account immediately.</p>
  `
  );

const orderConfirmation = (data) =>
  layout(
    `Order Confirmed #${(data.orderId || '').slice(0, 8).toUpperCase()} - BuildForge`,
    `
    <div style="margin-bottom: 20px;">
      <span class="badge badge-green">Order Confirmed</span>
    </div>
    <h2 style="margin-top: 0; font-size: 20px; font-weight: 800; color: #0f172a;">Thank you for your order!</h2>
    <p style="font-size: 14px; line-height: 1.6; color: #475569;">We've received your order and our hardware technicians are preparing your components for fulfillment.</p>
    
    <div class="card">
      <p style="margin: 0 0 6px 0; font-size: 13px;"><strong>Order Number:</strong> #${(data.orderId || '').slice(0, 8).toUpperCase()}</p>
      <p style="margin: 0 0 6px 0; font-size: 13px;"><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
      <p style="margin: 0; font-size: 13px;"><strong>Total Amount:</strong> $${(data.totalAmount || 0).toFixed(2)}</p>
    </div>

    <h3 style="font-size: 15px; font-weight: 700; margin: 24px 0 8px 0;">Itemized Summary</h3>
    <table>
      <thead>
        <tr>
          <th>Component</th>
          <th style="text-align: center;">Qty</th>
          <th style="text-align: right;">Price</th>
        </tr>
      </thead>
      <tbody>
        ${(data.items || [])
          .map(
            (item) => `
          <tr>
            <td><strong>${item.product?.name || item.name || 'Component'}</strong></td>
            <td style="text-align: center;">${item.qty}</td>
            <td style="text-align: right;">$${((item.priceSnapshot || item.price || 0) * item.qty).toFixed(2)}</td>
          </tr>
        `
          )
          .join('')}
      </tbody>
    </table>

    <div style="text-align: center; margin-top: 24px;">
      <a href="${env.CLIENT_URL}/orders/${data.orderId}" class="button">View Order & Tracking</a>
    </div>
  `
  );

const paymentReceipt = (data) =>
  layout(
    `Payment Receipt #${(data.orderId || '').slice(0, 8).toUpperCase()} - BuildForge`,
    `
    <div style="margin-bottom: 20px;">
      <span class="badge badge-blue">Payment Receipt</span>
    </div>
    <h2 style="margin-top: 0; font-size: 20px; font-weight: 800; color: #0f172a;">Payment Successfully Processed</h2>
    <p style="font-size: 14px; line-height: 1.6; color: #475569;">Your payment for Order #${(data.orderId || '').slice(0, 8).toUpperCase()} has been confirmed.</p>
    
    <div class="card">
      <p style="margin: 0 0 6px 0; font-size: 13px;"><strong>Amount Paid:</strong> $${(data.amount || 0).toFixed(2)}</p>
      <p style="margin: 0 0 6px 0; font-size: 13px;"><strong>Gateway:</strong> ${data.provider || 'RAZORPAY'}</p>
      ${data.transactionId ? `<p style="margin: 0; font-size: 13px;"><strong>Transaction ID:</strong> ${data.transactionId}</p>` : ''}
    </div>

    <div style="text-align: center; margin-top: 24px;">
      <a href="${env.CLIENT_URL}/orders/${data.orderId}" class="button">View Full Invoice</a>
    </div>
  `
  );

const shippingUpdate = (data) =>
  layout(
    `Your Order #${(data.orderId || '').slice(0, 8).toUpperCase()} Has Shipped!`,
    `
    <div style="margin-bottom: 20px;">
      <span class="badge badge-blue">Shipped</span>
    </div>
    <h2 style="margin-top: 0; font-size: 20px; font-weight: 800; color: #0f172a;">Your package is on the way!</h2>
    <p style="font-size: 14px; line-height: 1.6; color: #475569;">Great news! Your custom parts have been carefully packaged and dispatched with our courier partner.</p>
    
    <div class="card">
      <p style="margin: 0 0 6px 0; font-size: 13px;"><strong>Order ID:</strong> #${(data.orderId || '').slice(0, 8).toUpperCase()}</p>
      <p style="margin: 0 0 6px 0; font-size: 13px;"><strong>Carrier / Note:</strong> ${data.trackingNote || 'Standard Express Dispatch'}</p>
      <p style="margin: 0; font-size: 13px;"><strong>Dispatched Date:</strong> ${new Date().toLocaleDateString()}</p>
    </div>

    <div style="text-align: center; margin-top: 24px;">
      <a href="${env.CLIENT_URL}/tracking?orderId=${data.orderId}" class="button">Live Shipment Tracking</a>
    </div>
  `
  );

const orderDelivered = (data) =>
  layout(
    `Order #${(data.orderId || '').slice(0, 8).toUpperCase()} Delivered!`,
    `
    <div style="margin-bottom: 20px;">
      <span class="badge badge-green">Delivered</span>
    </div>
    <h2 style="margin-top: 0; font-size: 20px; font-weight: 800; color: #0f172a;">Package Delivered Successfully</h2>
    <p style="font-size: 14px; line-height: 1.6; color: #475569;">Your BuildForge package has been delivered to your destination. We hope you enjoy building and using your new hardware!</p>
    
    <div class="card">
      <p style="margin: 0 0 6px 0; font-size: 13px;"><strong>Order ID:</strong> #${(data.orderId || '').slice(0, 8).toUpperCase()}</p>
      <p style="margin: 0; font-size: 13px;"><strong>Delivery Window:</strong> 7-day return policy active from today.</p>
    </div>

    <div style="text-align: center; margin-top: 24px;">
      <a href="${env.CLIENT_URL}/orders/${data.orderId}" class="button">Write Review / Manage Order</a>
    </div>
  `
  );

const returnApproved = (data) =>
  layout(
    `Return Approved (RMA #${(data.returnId || '').slice(0, 8).toUpperCase()}) - BuildForge`,
    `
    <div style="margin-bottom: 20px;">
      <span class="badge badge-green">Return Approved</span>
    </div>
    <h2 style="margin-top: 0; font-size: 20px; font-weight: 800; color: #0f172a;">Return Request Approved</h2>
    <p style="font-size: 14px; line-height: 1.6; color: #475569;">Your return request for Order #${(data.orderId || '').slice(0, 8).toUpperCase()} has been approved. Your refund has been initiated.</p>
    
    <div class="card">
      <p style="margin: 0 0 6px 0; font-size: 13px;"><strong>RMA Number:</strong> #${(data.returnId || '').slice(0, 8).toUpperCase()}</p>
      <p style="margin: 0 0 6px 0; font-size: 13px;"><strong>Order Number:</strong> #${(data.orderId || '').slice(0, 8).toUpperCase()}</p>
      ${data.refundAmount ? `<p style="margin: 0; font-size: 13px;"><strong>Refund Amount:</strong> $${data.refundAmount.toFixed(2)}</p>` : ''}
    </div>

    <div style="text-align: center; margin-top: 24px;">
      <a href="${env.CLIENT_URL}/dashboard?tab=returns" class="button">View Returns Dashboard</a>
    </div>
  `
  );

const returnRejected = (data) =>
  layout(
    `Return Request Update (RMA #${(data.returnId || '').slice(0, 8).toUpperCase()}) - BuildForge`,
    `
    <div style="margin-bottom: 20px;">
      <span class="badge badge-amber">Return Update</span>
    </div>
    <h2 style="margin-top: 0; font-size: 20px; font-weight: 800; color: #0f172a;">Return Request Not Approved</h2>
    <p style="font-size: 14px; line-height: 1.6; color: #475569;">Our hardware support team has reviewed your return request for Order #${(data.orderId || '').slice(0, 8).toUpperCase()}.</p>
    
    <div class="card">
      <p style="margin: 0 0 6px 0; font-size: 13px;"><strong>Reason:</strong> ${data.reason || 'Item does not meet return eligibility criteria.'}</p>
      <p style="margin: 0; font-size: 13px;"><strong>Order Number:</strong> #${(data.orderId || '').slice(0, 8).toUpperCase()}</p>
    </div>

    <div style="text-align: center; margin-top: 24px;">
      <a href="${env.CLIENT_URL}/dashboard?tab=returns" class="button">View Returns Dashboard</a>
    </div>
  `
  );

const refundProcessed = (data) =>
  layout(
    `Refund Processed - Order #${(data.orderId || '').slice(0, 8).toUpperCase()}`,
    `
    <div style="margin-bottom: 20px;">
      <span class="badge badge-green">Refund Issued</span>
    </div>
    <h2 style="margin-top: 0; font-size: 20px; font-weight: 800; color: #0f172a;">Your Refund Has Been Processed</h2>
    <p style="font-size: 14px; line-height: 1.6; color: #475569;">A refund of $${(data.amount || 0).toFixed(2)} has been issued back to your original payment method.</p>
    
    <div class="card">
      <p style="margin: 0 0 6px 0; font-size: 13px;"><strong>Refund Amount:</strong> $${(data.amount || 0).toFixed(2)}</p>
      ${data.refundId ? `<p style="margin: 0 0 6px 0; font-size: 13px;"><strong>Refund ID:</strong> ${data.refundId}</p>` : ''}
      <p style="margin: 0; font-size: 13px;"><strong>Processing Time:</strong> 5-7 business days depending on your bank.</p>
    </div>

    <div style="text-align: center; margin-top: 24px;">
      <a href="${env.CLIENT_URL}/orders/${data.orderId}" class="button">View Order Details</a>
    </div>
  `
  );

const priceDropAlert = (data) =>
  layout(
    `Price Drop Alert: ${data.productName} is now $${(data.currentPrice || 0).toFixed(2)}!`,
    `
    <div style="margin-bottom: 20px;">
      <span class="badge badge-green">Price Drop</span>
    </div>
    <h2 style="margin-top: 0; font-size: 20px; font-weight: 800; color: #0f172a;">Price Alert Triggered!</h2>
    <p style="font-size: 14px; line-height: 1.6; color: #475569;">A component on your watchlist has dropped below your target price threshold.</p>
    
    <div class="card">
      <p style="margin: 0 0 6px 0; font-size: 14px; font-weight: 700; color: #0f172a;">${data.productName}</p>
      <p style="margin: 0 0 6px 0; font-size: 13px;"><strong>New Price:</strong> <span style="color: #16a34a; font-weight: 800;">$${(data.currentPrice || 0).toFixed(2)}</span></p>
      <p style="margin: 0; font-size: 13px;"><strong>Your Target Price:</strong> $${(data.targetPrice || 0).toFixed(2)}</p>
    </div>

    <div style="text-align: center; margin-top: 24px;">
      <a href="${env.CLIENT_URL}/products/${data.productSlug || ''}" class="button">Buy at Discounted Price</a>
    </div>
  `
  );

module.exports = {
  verifyEmail,
  resetPassword,
  orderConfirmation,
  paymentReceipt,
  shippingUpdate,
  orderDelivered,
  returnApproved,
  returnRejected,
  refundProcessed,
  priceDropAlert,
};
