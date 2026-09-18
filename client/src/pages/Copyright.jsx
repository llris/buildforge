import React, { useState, useEffect } from 'react';
import { Copyright as CopyrightIcon, Clock, CheckCircle, Scale } from 'lucide-react';
import api from '../api/axios';
import FormattedTerms from '../components/FormattedTerms';

const FALLBACK_COPYRIGHT_CONTENT = `
This Copyright & Trademark Notice governs all proprietary materials, software engines, databases, text, branding, and graphics published on the BuildForge platform by BuildForge Technologies.

1. PROPRIETARY CONTENT & COPYRIGHT PROTECTION

All content on the BuildForge platform — including but not limited to the user interface designs, visual layouts, website code, component classification schemes, curated hardware datasets, graphic assets, and editorial text — is the proprietary property of BuildForge Technologies and is protected under the Copyright Act, 1957 (India), international copyright treaties, and applicable intellectual property laws.

2. SMART PC COMPATIBILITY ENGINE AS A PROTECTED WORK

The Smart PC Compatibility Engine, clearance heuristic matrix, dynamic wattage calculation formulas, bottleneck analysis models, and automated build generation algorithms developed by BuildForge are original literary works (computer programmes) protected under Section 2(o) and Section 13(1)(a) of the Copyright Act, 1957. All rights in the algorithmic structure, logic flow, and data aggregation methods are strictly reserved by BuildForge Technologies.

3. PERMITTED PERSONAL NON-COMMERCIAL USE

BuildForge grants users a limited, non-exclusive, non-transferable, revocable license to access and use the platform for personal, non-commercial purposes:
• Researching computer hardware specifications and pricing.
• Configuring, validating, saving, and sharing custom PC part lists.
• Purchasing hardware components and managing orders.
Users may print or download portions of material from the site solely for personal reference, provided all copyright and proprietary notices remain intact.

4. PROHIBITED ACTIVITIES

Except as expressly permitted above, any use of the platform's content without prior written authorization from BuildForge Technologies is strictly prohibited. You agree not to:
• Systematically extract, harvest, screen-scrape, or data-mine hardware prices, specifications, or compatibility rules using automated scripts, bots, spiders, or crawlers.
• Decompile, disassemble, reverse-engineer, or attempt to derive the source code or proprietary heuristics of the compatibility engine.
• Republish, mirror, redistribute, syndicate, or commercially exploit any platform content, datasets, or build configurations.
• Frame or embed the BuildForge website or custom builder interface within third-party applications or websites without explicit written consent.
Unauthorized use may result in immediate account termination, civil claims for statutory damages, and criminal prosecution.

5. THIRD-PARTY TRADEMARKS & FAIR USE DISCLAIMER

All third-party trademarks, registered trademarks, service marks, brand names, and logos displayed on this platform (including Intel, AMD, NVIDIA, ASUS, MSI, Gigabyte, Corsair, Noctua, Western Digital, EVGA, Seasonic, G.Skill, Lian Li, NZXT, Samsung, Kingston, and others) are the property of their respective owners.

Their use on BuildForge is solely for the nominative and descriptive purpose of product identification, component compatibility assessment, and hardware cataloging. No sponsorship, affiliation, endorsement, or commercial association between BuildForge Technologies and these trademark owners is expressed or implied.

6. INFRINGEMENT CLAIMS & NOTICE PROCEDURE

BuildForge respects the intellectual property rights of others. If you are a copyright owner or an authorized agent and believe that any content hosted on this platform infringes your copyright, please submit a formal notice to our legal department at:

Email: legal@buildforge.in
Physical Address: Legal Counsel, BuildForge Technologies, JVLR, Jogeshwari, Mumbai 400060, Maharashtra, India

Your notice must include:
1. Identification of the copyrighted work claimed to have been infringed.
2. The exact URL or location on our platform where the alleged infringing material is located.
3. Your contact information (name, organization, address, telephone number, and email).
4. A statement confirming your good-faith belief that the disputed use is not authorized by the copyright owner, its agent, or the law.
5. A statement, made under penalty of perjury, that the information in your notice is accurate and that you are authorized to act on behalf of the owner.
`.trim();

export default function Copyright() {
  const [copyrightData, setCopyrightData] = useState({
    version: '1.0',
    effectiveDate: '2026-08-24',
    content: FALLBACK_COPYRIGHT_CONTENT,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/legal/copyright')
      .then((res) => {
        if (res.data?.data?.content) {
          setCopyrightData(res.data.data);
        }
      })
      .catch((err) => {
        console.error('Failed to load copyright from API, using fallback:', err);
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
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold mb-3">
              <Scale className="w-3.5 h-3.5" />
              <span>Intellectual Property & Trademarks</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Copyright & Trademark Notice
            </h1>
            <p className="mt-2 text-sm text-gray-400">
              Protection of proprietary algorithms, database rights under Copyright Act 1957, permitted personal use, and OEM trademark fair use.
            </p>
          </div>

          <div className="flex flex-col items-center sm:items-end gap-1.5 text-xs text-gray-400 bg-gray-800/50 p-4 rounded-xl border border-gray-800 shrink-0">
            <div className="flex items-center gap-1.5 text-purple-400 font-bold">
              <CheckCircle className="w-4 h-4" />
              <span>Version {copyrightData.version}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-gray-500" />
              <span>Effective: {copyrightData.effectiveDate}</span>
            </div>
          </div>
        </div>

        {/* Content Card */}
        <div className="bg-gray-800/90 border border-gray-700/80 rounded-2xl p-6 sm:p-10 shadow-xl">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
            </div>
          ) : (
            <FormattedTerms content={copyrightData.content} isCompact={false} />
          )}
        </div>
      </div>
    </div>
  );
}
