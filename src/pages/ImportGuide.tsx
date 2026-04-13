import React from 'react';

export default function ImportGuide() {
  return (
    <div className="min-h-screen bg-[#0f0f0f] pt-32 pb-20 text-white">
      <div className="max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl md:text-4xl font-light tracking-[0.1em] uppercase mb-6">
          Compliance & Import Guide
        </h1>
        <p className="text-gray-400 mb-12 max-w-2xl">
          Understanding the legal requirements for importing a vehicle into your country is crucial. Below is a summary of the key regulations for our most popular destinations.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/20 text-xs tracking-[0.2em] uppercase text-gray-400">
                <th className="py-4 px-6 font-medium">Destination</th>
                <th className="py-4 px-6 font-medium">Steering Rule</th>
                <th className="py-4 px-6 font-medium">Age Limit (2026)</th>
                <th className="py-4 px-6 font-medium">Key Legal Requirement</th>
              </tr>
            </thead>
            <tbody className="text-sm text-gray-300">
              <tr className="border-b border-white/10 hover:bg-white/5 transition-colors">
                <td className="py-4 px-6 font-medium text-white">Saudi Arabia</td>
                <td className="py-4 px-6">LHD Only</td>
                <td className="py-4 px-6">Max 5 Years</td>
                <td className="py-4 px-6">Must pass SASO/SABER inspection.</td>
              </tr>
              <tr className="border-b border-white/10 hover:bg-white/5 transition-colors">
                <td className="py-4 px-6 font-medium text-white">UAE</td>
                <td className="py-4 px-6">LHD Only</td>
                <td className="py-4 px-6">Max 10 Years</td>
                <td className="py-4 px-6">Salvage/Flood titles are strictly banned.</td>
              </tr>
              <tr className="border-b border-white/10 hover:bg-white/5 transition-colors">
                <td className="py-4 px-6 font-medium text-white">Morocco</td>
                <td className="py-4 px-6">LHD/RHD</td>
                <td className="py-4 px-6">Max 5 Years</td>
                <td className="py-4 px-6">Date of manufacture must be verified.</td>
              </tr>
              <tr className="border-b border-white/10 hover:bg-white/5 transition-colors">
                <td className="py-4 px-6 font-medium text-white">Turkey</td>
                <td className="py-4 px-6">LHD Only</td>
                <td className="py-4 px-6">New/Returning</td>
                <td className="py-4 px-6">Restricted to Residence Permit holders.</td>
              </tr>
              <tr className="border-b border-white/10 hover:bg-white/5 transition-colors">
                <td className="py-4 px-6 font-medium text-white">Cyprus</td>
                <td className="py-4 px-6">RHD OK</td>
                <td className="py-4 px-6">No Limit</td>
                <td className="py-4 px-6">Requires local TOM (MOT) test.</td>
              </tr>
              <tr className="border-b border-white/10 hover:bg-white/5 transition-colors">
                <td className="py-4 px-6 font-medium text-white">Spain / NL</td>
                <td className="py-4 px-6">LHD/RHD</td>
                <td className="py-4 px-6">No Limit</td>
                <td className="py-4 px-6">Needs Individual Vehicle Approval (IVA).</td>
              </tr>
              <tr className="border-b border-white/10 hover:bg-white/5 transition-colors">
                <td className="py-4 px-6 font-medium text-white">Monaco</td>
                <td className="py-4 px-6">LHD/RHD</td>
                <td className="py-4 px-6">No Limit</td>
                <td className="py-4 px-6">Must meet French safety standards.</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div className="mt-12 p-6 bg-white/5 border border-white/10 rounded-lg">
          <h3 className="text-sm font-medium tracking-[0.1em] text-white uppercase mb-2">Disclaimer</h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            Import regulations are subject to change by national governments without prior notice. While we strive to keep this guide accurate, it is the buyer's ultimate responsibility to confirm current import laws with their local customs authority prior to purchase.
          </p>
        </div>
      </div>
    </div>
  );
}
