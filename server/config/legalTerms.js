/**
 * BuildForge — Terms & Conditions
 * Versioned legal terms served by GET /api/v1/legal/terms
 * and displayed in the signup acceptance modal and the public /terms page.
 */

const TERMS_VERSION = "1.0";
const TERMS_EFFECTIVE_DATE = "2026-08-24";

const TERMS_CONTENT = `
These Terms and Conditions ("Terms") govern your use of the BuildForge platform operated by BuildForge Technologies ("BuildForge", "we", "us"), registered at JVLR, Jogeshwari, Mumbai 400060, Maharashtra, India. By creating an account, placing an order, or making a payment, you confirm that you have read, understood, and agree to be bound by these Terms.

1. ELIGIBILITY

You must be at least 18 years of age and capable of entering into a legally binding contract under the Indian Contract Act, 1872. If you are under 18, you may use the platform only with the involvement and consent of a parent or lawful guardian.

2. ACCOUNT REGISTRATION AND SECURITY

You agree to provide accurate, current, and complete information at registration and to keep it updated. You are responsible for maintaining the confidentiality of your password and for all activity under your account. Notify us immediately of any unauthorised access. We may suspend or terminate accounts that provide false information, abuse the platform, or breach these Terms.

3. USE OF THE COMPATIBILITY ENGINE

The compatibility engine, Build Advisor, and all associated estimates are advisory tools provided for guidance only. You acknowledge that a "compatible" result is NOT a guarantee and that you remain responsible for verifying component compatibility against manufacturer documentation before purchase. Wattage figures, bottleneck indicators, and performance or FPS estimates are approximations and are not benchmark guarantees. You agree not to scrape, reverse-engineer, or commercially exploit the engine or its underlying specification database.

4. PRODUCT LISTINGS, PRICING AND AVAILABILITY

All prices are listed in Indian Rupees and are inclusive or exclusive of applicable GST as indicated at checkout. Prices, specifications, and availability may change without notice. Listings are an invitation to offer, not a binding offer; your order constitutes an offer that we may accept or decline. Where a product is listed at a materially incorrect price or specification due to a technical or human error, we may cancel the affected order and refund any amount paid in full.

5. ORDERS AND ACCEPTANCE

An order is confirmed only upon successful payment authorisation and issuance of an order confirmation. We reserve the right to decline or cancel an order, including where stock is unavailable, the delivery address is outside our serviceable area, payment cannot be verified, or we suspect fraudulent or abusive activity.

6. STOCK RESERVATION

Adding items to your cart does not reserve stock. Stock is provisionally reserved for a limited period during checkout. If payment is not completed within that period, the reservation lapses and the items are returned to general availability.

7. PAYMENTS

Payments are processed by a third-party payment gateway. BuildForge does not collect or store your complete card details on its own servers. You warrant that any payment instrument used belongs to you or that you are authorised to use it. All amounts payable, including taxes and shipping, are computed and displayed by us before you authorise payment.

8. TAXES AND INVOICING

Applicable Goods and Services Tax (GST) is charged in accordance with Indian tax law. A tax invoice will be issued for each completed order.

9. SHIPPING AND DELIVERY

Delivery timelines shown at checkout are estimates and are not guaranteed. Risk in the goods passes to you upon delivery. You or your authorised representative must inspect packages on delivery and report visible damage or missing items within 48 hours.

10. CANCELLATION

You may cancel an order before it is dispatched, at no charge. Once dispatched, cancellation is subject to our returns process. We do not levy cancellation charges on consumers.

11. RETURNS, REPLACEMENT AND REFUNDS

Returns may be requested within 7 days of delivery for items that are unused, undamaged, and in their original packaging with all accessories and seals intact. Certain items, including opened software and components showing physical damage, static damage, or removed serial or warranty labels, are not eligible for return. Approved refunds are processed to the original payment method within the timelines prescribed by the Reserve Bank of India. Defective items may be replaced or refunded following inspection.

12. MANUFACTURER WARRANTY

Products carry the manufacturer's warranty only. BuildForge does not extend or substitute for that warranty. Warranty claims after the return window must be pursued with the manufacturer or its authorised service centre; we will assist with documentation where reasonably possible.

13. USER CONTENT

You may publish build configurations, reviews, questions, and answers. You are responsible for such content and grant BuildForge a non-exclusive, royalty-free licence to host, display, and distribute it on the platform. You may not post content that is unlawful, defamatory, obscene, misleading, infringing, or that impersonates another person. We may moderate, edit, or remove content and may withhold or remove reviews not associated with a verified purchase.

14. ACCEPTABLE USE

You agree not to: (a) use automated tools to scrape or harvest data; (b) attempt to gain unauthorised access to any part of the platform; (c) interfere with the platform's security or availability; (d) use the platform for unlawful purposes; or (e) resell products obtained through the platform in a manner that breaches these Terms.

15. PRIVACY AND DATA PROTECTION

Personal data is collected and processed in accordance with our Privacy Policy and the Digital Personal Data Protection Act, 2023. By accepting these Terms you acknowledge the Privacy Policy. Consent to processing may be withdrawn as described there, subject to our need to retain records for completed transactions and statutory compliance.

16. INTELLECTUAL PROPERTY

All platform content, including the website design, product data, and the Smart PC Compatibility Engine and its underlying rule set and algorithms, is the property of BuildForge Technologies or its licensors and is protected under the Copyright Act, 1957. Manufacturer trademarks referenced on the platform belong to their respective owners and are used for identification purposes only. No rights are granted except as expressly stated.

17. GRIEVANCE REDRESSAL

In accordance with the Consumer Protection (E-Commerce) Rules, 2020, complaints may be addressed to our Grievance Officer:

Name: Travis Hancock
Email: grievance@buildforge.in
Phone: +91 99304 60497

Complaints will be acknowledged within 48 hours of receipt and resolved within one month.

18. LIMITATION OF LIABILITY

To the maximum extent permitted by law, our aggregate liability in respect of any order shall not exceed the amount paid for that order. We are not liable for indirect, incidental, consequential, or special damages, including loss of data, profits, or use, arising from reliance on the compatibility engine or the use of products purchased through the platform. Nothing here excludes rights that cannot lawfully be excluded under the Consumer Protection Act, 2019.

19. FORCE MAJEURE

We are not liable for delay or failure caused by events beyond our reasonable control, including natural disasters, strikes, network or power failures, or governmental action.

20. AMENDMENTS

We may amend these Terms. Material changes will be notified on the platform, and continued use after the effective date constitutes acceptance. The version applicable to an order is the version in force when the order was placed.

21. GOVERNING LAW AND JURISDICTION

These Terms are governed by the laws of India. Subject to consumer rights to approach the appropriate consumer forum, the courts at Mumbai, Maharashtra shall have exclusive jurisdiction.

22. ACCEPTANCE

By ticking the acceptance box at registration and by proceeding to payment, you confirm that you have read and agree to these Terms, the Disclaimer, and the Privacy Policy.
`.trim();

module.exports = { TERMS_VERSION, TERMS_EFFECTIVE_DATE, TERMS_CONTENT };
