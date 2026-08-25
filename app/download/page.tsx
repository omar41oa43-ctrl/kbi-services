'use client';

import React, { useState } from 'react';

export default function DownloadAppPage() {
  const [copied, setCopied] = useState(false);
  const downloadUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/download/kbi-technician.apk`
    : 'http://10.101.23.206:3000/download/kbi-technician.apk';

  const copyToClipboard = () => {
    navigator.clipboard.writeText(downloadUrl);
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
            Technician Portal App
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
              src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(downloadUrl)}`} 
              alt="Scan to download KBI Technician APK"
              className="w-40 h-40"
            />
          </div>
          <p className="text-xs text-slate-400 font-medium text-center">
            Scan with your phone camera to download directly
          </p>
        </div>

        {/* Direct Download Action Button */}
        <div className="space-y-3">
          <a
            href="/download/kbi-technician.apk"
            download="kbi-technician.apk"
            className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white font-bold py-4 px-6 rounded-2xl shadow-lg shadow-blue-600/30 transition-all"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.551 0 .9992.4482.9992.9993s-.4482.9997-.9992.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993s-.4482.9997-.9993.9997m11.4045-6.02l1.996-3.4563c.0991-.1716.0402-.3908-.1314-.49-.1716-.0992-.3908-.0403-.49.1314l-2.0232 3.5042c-1.4284-.652-3.0237-1.0183-4.7329-1.0183-1.7092 0-3.3045.3663-4.7329 1.0183l-2.0232-3.5042c-.0992-.1717-.3184-.2306-.49-.1314-.1716.0992-.2305.3184-.1314.49l1.996 3.4563C3.5936 10.597 1.5 13.9068 1.5 17.75h21c0-3.8432-2.0936-7.153-5.6185-8.4286"/>
            </svg>
            <span>Download Android APK (64.8 MB)</span>
          </a>

          {/* Copy Direct Link */}
          <button
            onClick={copyToClipboard}
            className="w-full flex items-center justify-center gap-2 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 font-medium py-3 px-4 rounded-xl text-xs transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span>{copied ? 'Link Copied to Clipboard!' : 'Copy Direct Download Link'}</span>
          </button>
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
              <strong className="text-slate-200">iOS (iPhone):</strong> Run directly on your connected iPhone via Xcode / Flutter or access the technician dashboard via web app.
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
