import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, CheckCircle, Shield } from 'lucide-react';
import api from '../api/axios';
import FormattedTerms from '../components/FormattedTerms';

const FALLBACK_DISCLAIMER_CONTENT = `
This Disclaimer applies to all services, automated tools, compatibility calculations, hardware specifications, and product offerings provided on the BuildForge platform by BuildForge Technologies. Please review these disclosures thoroughly.

1. COMPATIBILITY ENGINE IS ADVISORY ONLY

The Smart PC Compatibility Engine, Build Advisor, bottleneck analysis matrix, system wattage calculators, and FPS/resolution projections apply automated, rule-based algorithmic logic to manufacturer-published specifications. BuildForge does not warrant or guarantee that a configuration marked as "compatible" will function, fit, or perform as expected in all real-world conditions, nor that specification data is comprehensive, error-free, or continuously current.

Physical tolerances (such as cable routing, RAM heat-spreader clearances under dual-tower coolers, or front radiator vs. long GPU interference), electrical transients, thermal dynamics, and firmware/BIOS version mismatches may create incompatibilities not captured by automated rules. Performance scores and FPS projections are relative theoretical estimates and do not represent benchmark guarantees. Users remain solely responsible for independently verifying all dimensions, power requirements, and socket clearances against official manufacturer documentation prior to purchase. A "compatible" validation does not constitute a guarantee of fitness for any particular purpose.

2. ASSEMBLY AND INSTALLATION

BuildForge operates strictly as a retailer of computer hardware components and does not assemble, configure, or test custom PC systems on behalf of customers. System assembly, component handling, thermal paste application, cabling, and BIOS configuration are performed entirely at the customer's own risk.

Improper assembly, electrostatic discharge (ESD), bent CPU/motherboard socket pins, incorrect power supply cabling, reverse polarity connections, overtightened cooler mounting brackets, or overclocking and overvolting can cause catastrophic hardware failure and typically voids the manufacturer's warranty. BuildForge accepts no liability for physical, electrical, or thermal damage resulting from assembly, installation, modification, or operation outside manufacturer-specified tolerances.

3. MANUFACTURER WARRANTY

All hardware products sold on BuildForge carry the respective manufacturer's original limited warranty. BuildForge is not the warrantor and does not provide, extend, or substitute for the manufacturer's warranty. Warranty coverage, terms, duration, and claim procedures are determined solely by the respective manufacturer (e.g., Intel, AMD, ASUS, MSI, Corsair, Gigabyte, NVIDIA). BuildForge will provide reasonable assistance by supplying purchase invoices and facilitating claim documentation upon customer request.

4. PRODUCT INFORMATION AND PRICING

Product descriptions, technical specifications, dimensional drawings, stock availability indicators, and pricing are compiled from manufacturer data feeds and internal databases. While we strive for absolute accuracy, listings may occasionally contain typographical errors, inaccuracies, or outdated specifications. Product images are for representative and illustrative purposes only and may differ slightly from the physical item delivered.

BuildForge reserves the right to correct any errors, inaccuracies, or omissions at any time without prior notice. In the event that a product is ordered at a materially incorrect price or with erroneous specifications, BuildForge reserves the right to cancel the affected order and issue a full refund to the customer's original payment method.

5. THIRD-PARTY SERVICES AND INFRASTRUCTURE

The BuildForge platform integrates with and relies upon third-party service providers for payment processing (e.g. Razorpay), cloud hosting, media delivery, and automated email communications. BuildForge is not liable for service interruptions, gateway downtimes, transmission delays, or network outages resulting from causes beyond our reasonable operational control.

6. LIMITATION OF LIABILITY

To the maximum extent permitted by applicable law, the aggregate liability of BuildForge Technologies for any claim, dispute, or loss arising out of or related to any order, transaction, or use of the platform shall not exceed the total purchase price actually paid by the customer for that specific order. Under no circumstances shall BuildForge be liable for indirect, incidental, consequential, punitive, or special damages, including but not limited to loss of data, loss of profits, system downtime, or personal inconvenience.

Nothing in this Disclaimer is intended to limit or exclude any statutory consumer rights that cannot be lawfully excluded or limited under the Consumer Protection Act, 2019.
`.trim();

export default function Disclaimer() {
  const [disclaimerData, setDisclaimerData] = useState({
    version: '1.0',
    effectiveDate: '2026-08-24',
    content: FALLBACK_DISCLAIMER_CONTENT,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/legal/disclaimer')
      .then((res) => {
        if (res.data?.data?.content) {
          setDisclaimerData(res.data.data);
        }
      })
      .catch((err) => {
        console.error('Failed to load disclaimer from API, using fallback:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Page Header */}
        <div className="border-b border-gray-800 pb-8 text-center sm:text-left flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-3">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Legal Disclosures & Advisory</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Hardware & Compatibility Disclaimer
            </h1>
            <p className="mt-2 text-sm text-gray-400">
              Important information regarding our compatibility engine, assembly liabilities, warranty facilitation, and platform limits.
            </p>
          </div>

          <div className="flex flex-col items-center sm:items-end gap-1.5 text-xs text-gray-400 bg-gray-800/50 p-4 rounded-xl border border-gray-800 shrink-0">
            <div className="flex items-center gap-1.5 text-amber-400 font-bold">
              <CheckCircle className="w-4 h-4" />
              <span>Version {disclaimerData.version}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-gray-500" />
              <span>Effective: {disclaimerData.effectiveDate}</span>
            </div>
          </div>
        </div>

        {/* Content Card */}
        <div className="bg-gray-800/90 border border-gray-700/80 rounded-2xl p-6 sm:p-10 shadow-xl">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
            </div>
          ) : (
            <FormattedTerms content={disclaimerData.content} isCompact={false} />
          )}
        </div>
      </div>
    </div>
  );
}
