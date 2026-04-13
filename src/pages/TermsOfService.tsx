import React from 'react';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-[#0f0f0f] pt-32 pb-20 text-white">
      <div className="max-w-[800px] mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl md:text-4xl font-light tracking-[0.1em] uppercase mb-12">
          Master Terms of Service (2026)
        </h1>

        <div className="space-y-12 text-gray-300 leading-relaxed">
          
          <section>
            <h2 className="text-xl font-medium tracking-wider text-white uppercase mb-4">1. Scope of the "Total Cost" Guarantee</h2>
            <p className="mb-4">This website operates under DDP (Delivered Duty Paid) Incoterms.</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong className="text-white">What this means:</strong> When you pay the "Total Cost" on our site, we are responsible for the vehicle purchase, international ocean freight, marine insurance, destination port handling, and the payment of all national import duties and Value Added Tax (VAT/IVA) in your selected country.</li>
              <li><strong className="text-white">Exclusions:</strong> Our "Total Cost" does not include local registration fees (license plates), mandatory local roadworthiness tests (MOT/ITV/IVA/TOM), or towing from the destination port to your residence unless "Home Delivery" is explicitly added to your invoice.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-medium tracking-wider text-white uppercase mb-4">2. Vehicle Condition & Sourcing Disclosures</h2>
            <p className="mb-4">We source vehicles globally, including New and Pre-Owned inventory.</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong className="text-white">Condition:</strong> Pre-owned vehicles are sold "As-Is". We provide the original inspection reports (e.g., Japanese Auction Sheets, European Dekra, or US Carfax). By purchasing, you acknowledge that used vehicles may have minor cosmetic wear consistent with age.</li>
              <li><strong className="text-white">Mechanical Warranty:</strong> As a global broker, we do not provide a mechanical warranty. We guarantee only that the vehicle matches the condition report provided at the time of sale.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-medium tracking-wider text-white uppercase mb-4">3. Mandatory Compliance & Buyer Responsibility</h2>
            <p className="mb-4">While we provide a "Total Cost," the legal eligibility of the vehicle for your specific country is your responsibility.</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong className="text-white">Steering Position:</strong> You must verify if your country allows Right-Hand Drive (RHD) or requires Left-Hand Drive (LHD). (Note: Saudi Arabia and UAE strictly require LHD for road use).</li>
              <li><strong className="text-white">Age Restrictions:</strong> You must verify your country's age limits (e.g., 5-year limit for Saudi Arabia and Morocco).</li>
              <li><strong className="text-white">System Errors:</strong> If our AI allows you to purchase a vehicle that is legally barred from your country, we reserve the right to cancel the order and issue a full refund prior to shipping.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-medium tracking-wider text-white uppercase mb-4">4. KYC (Know Your Customer) & Power of Attorney</h2>
            <p className="mb-4">To clear your vehicle through customs and pay taxes on your behalf, we require your legal identification.</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong className="text-white">Documentation:</strong> Within 72 hours of payment, you must upload a high-resolution Passport copy and your local Tax ID (e.g., Saudi National ID, Spanish NIE, Dutch BSN).</li>
              <li><strong className="text-white">Agency Authorization:</strong> By paying the "Total Cost," you grant APX Dealer and our appointed customs brokers the limited Power of Attorney to act as your agent for customs declarations and tax payments.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-medium tracking-wider text-white uppercase mb-4">5. Cancellation & Forfeiture Policy</h2>
            <p className="mb-4">International vehicle procurement involves immediate non-refundable costs.</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong className="text-white">Final Sale:</strong> Once we have secured the vehicle from the global supplier, the sale is strictly final.</li>
              <li><strong className="text-white">Defaults:</strong> If you fail to provide the required KYC documents or fail to pick up the vehicle from the port, resulting in excessive storage fees, those fees will be deducted from your account, and the vehicle may be re-sold to recover costs.</li>
            </ul>
          </section>

        </div>
      </div>
    </div>
  );
}
