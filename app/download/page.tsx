'use client';

import React, { useState } from 'react';

export default function DownloadAppPage() {
  const [copied, setCopied] = useState(false);
  const apkDownloadUrl = 'https://github.com/omar41oa43-ctrl/kbi-services/releases/download/v1.4.2/kbi-technician.apk';

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="adaptive-theme-page min-h-screen bg-[#0A0D14] text-white flex flex-col items-center justify-center p-4 sm:p-6 selection:bg-cyan-500 selection:text-black">
      {/* Background ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-600/15 rounded-full blur-[140px]" />
        <div className="absolute bottom-0 right-10 w-[450px] h-[450px] bg-teal-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-lg w-full bg-slate-900/80 border border-slate-800 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 shadow-2xl">
        {/* Header */}
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-teal-400 p-0.5 shadow-lg shadow-blue-500/20 mb-4">
            <div className="w-full h-full bg-slate-950 rounded-2xl flex items-center justify-center">
              <span className="font-extrabold text-2xl tracking-tighter">
                KBI<span className="text-teal-400">.</span>
              </span>
            </div>
          </div>
          <span className="px-3 py-1 bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-semibold rounded-full uppercase tracking-wider mb-2">
            Technician Portal App • v1.4.2
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
            Download KBI Technician App
          </h1>
          <p className="text-sm text-slate-400 max-w-xs">
            Fast on-site dispatch, live GPS tracking, and real-time order management.
          </p>
        </div>

        {/* QR Code Card */}
        <div className="my-6 bg-slate-950/70 border border-slate-800 rounded-2xl p-5 flex flex-col items-center justify-center">
          <div className="bg-white p-3 rounded-xl shadow-md mb-3">
            <img 
              src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(apkDownloadUrl)}`} 
              alt="Scan to download KBI Technician APK"
              className="w-40 h-40"
            />
          </div>
          <p className="text-xs text-slate-400 font-medium text-center">
            Scan with phone camera to download APK directly
          </p>
        </div>

        {/* Direct Download Action Buttons */}
        <div className="space-y-3">
          <a
            href={apkDownloadUrl}
            className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white font-bold py-4 px-6 rounded-2xl shadow-lg shadow-blue-600/30 transition-all"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.551 0 .9992.4482.9992.9993s-.4482.9997-.9992.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993s-.4482.9997-.9993.9997m11.4045-6.02l1.996-3.4563c.0991-.1716.0402-.3908-.1314-.49-.1716-.0992-.3908-.0403-.49.1314l-2.0232 3.5042c-1.4284-.652-3.0237-1.0183-4.7329-1.0183-1.7092 0-3.3045.3663-4.7329 1.0183l-2.0232-3.5042c-.0992-.1717-.3184-.2306-.49-.1314-.1716.0992-.2305.3184-.1314.49l1.996 3.4563C3.5936 10.597 1.5 13.9068 1.5 17.75h21c0-3.8432-2.0936-7.153-5.6185-8.4286"/>
            </svg>
            <span>Download Android APK (64 MB)</span>
          </a>

          <div
            aria-disabled="true"
            className="w-full flex items-center justify-center gap-3 bg-slate-800/70 border border-slate-700 text-slate-400 font-bold py-3.5 px-6 rounded-2xl"
          >
            <svg className="w-5 h-5 text-slate-300" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.92-2.85-.9.04-1.99.6-2.63 1.35-.57.65-1.06 1.72-.93 2.74 1.01.08 2.02-.49 2.64-1.24z"/>
            </svg>
            <span>iOS • TestFlight release coming soon</span>
          </div>

          {/* Copy Direct Link */}
          <button
            onClick={() => copyToClipboard(apkDownloadUrl)}
            className="w-full flex items-center justify-center gap-2 bg-slate-800/50 hover:bg-slate-700/60 border border-slate-800 text-slate-400 hover:text-slate-200 font-medium py-2.5 px-4 rounded-xl text-xs transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span>{copied ? 'Link Copied to Clipboard!' : 'Copy Direct Download Link'}</span>
          </button>
        </div>

        <div className="mt-6 rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4">
          <h2 className="text-sm font-bold text-blue-200">What&apos;s new in v1.4.2</h2>
          <ul className="mt-2 space-y-1 text-xs text-slate-300 list-disc list-inside">
            <li>Accept or reject every new assignment from the order screen</li>
            <li>Confirmation required before accepting or rejecting an order</li>
            <li>Automatic admin notification with technician and order details</li>
            <li>Reliable synchronized decisions across every order view</li>
          </ul>
        </div>

        {/* Instructions */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 text-left space-y-3">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Quick Installation Notes:
          </h3>
          <ul className="text-xs text-slate-400 space-y-2 list-disc list-inside">
            <li>
              <strong className="text-slate-200">Android:</strong> Tap <span className="text-blue-400">Download</span>. When prompted, allow <em>"Install from Unknown Sources"</em> or <em>"Download anyway"</em>.
            </li>
            <li>
              <strong className="text-slate-200">iOS (iPhone):</strong> Installation will be provided through TestFlight after Apple signing and review are completed.
            </li>
            <li>
              <strong className="text-slate-200">Login:</strong> Use your registered technician email and password.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
