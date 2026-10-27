"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import {
  ArrowDown,
  ArrowUpRight,
  Check,
  ChevronDown,
  Copy,
  ShieldCheck,
  Smartphone,
  Sun,
  Moon,
} from "lucide-react";
import styles from "./download.module.css";

const release = {
  version: "1.4.5",
  url: "https://github.com/omar41oa43-ctrl/kbi-services/releases/download/v1.4.5/kbi-technician.apk",
  iosUrl: "https://github.com/omar41oa43-ctrl/kbi-services/releases/download/v1.4.5/kbi-technician.ipa",
};
const pageUrl = "https://kbi.services/download";

export default function DownloadAppPage() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [copyStatus, setCopyStatus] = useState("");
  const [qrFailed, setQrFailed] = useState(false);
  const installation = useRef<HTMLDetailsElement>(null);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(pageUrl);
      setCopyStatus("Link copied. Share it with your phone.");
    } catch {
      setCopyStatus(
        "Could not copy automatically. Open kbi.services/download on your phone.",
      );
    }
  }

  return (
    <div className={styles.page} data-theme={theme} data-testid="download-page">
      <header className={styles.header}>
        <a href="/" className={styles.brand} aria-label="KBI Services home">
          <Image
            unoptimized
            src="/kbi-logo.png"
            alt="KBI"
            width={68}
            height={29}
            priority
          />
        </a>
        <div className={styles.headerActions}>
          <a href="/contact" className={styles.support}>
            Support <ArrowUpRight size={15} aria-hidden="true" />
          </a>
          <button
            type="button"
            className={styles.themeToggle}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? (
              <Sun size={17} aria-hidden="true" />
            ) : (
              <Moon size={17} aria-hidden="true" />
            )}
          </button>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.appIcon} data-testid="technician-logo">
          <Image
            unoptimized
            src="/kbi-logo.png"
            alt="KBI"
            width={68}
            height={29}
            priority
          />
          <span>TECH</span>
        </div>
        <p className={styles.eyebrow}>THE TECHNICIAN APP</p>
        <h1>
          Less admin.
          <br />
          <span>More doing.</span>
        </h1>
        <p className={styles.lead}>
          Your jobs, updates and earnings.
          <br />
          Everything you need, wherever you work.
        </p>

        <section
          className={styles.downloadCard}
          aria-label="Download KBI Technician"
        >
          <div className={styles.downloadContent}>
            <div className={styles.appHeading}>
              <h2>KBI Technician</h2>
              <span className={styles.available}>
                <span /> Android
              </span>
            </div>
            <p className={styles.releaseInfo}>
              Version {release.version} · Android APK · Free
            </p>
            <a
              href={release.url}
              className={styles.primary}
              data-testid="android-download"
            >
              Download for Android <ArrowDown size={19} aria-hidden="true" />
            </a>
            <div className={styles.smallActions}>
              <a
                href="#installation"
                onClick={() => {
                  if (installation.current) installation.current.open = true;
                }}
              >
                How to install
              </a>
              <button type="button" onClick={copyLink}>
                {copyStatus.startsWith("Link copied") ? (
                  <Check size={14} aria-hidden="true" />
                ) : (
                  <Copy size={14} aria-hidden="true" />
                )}{" "}
                Copy page link
              </button>
            </div>
          </div>
          <div className={styles.qrColumn}>
            <div className={styles.qrBox}>
              {qrFailed ? (
                <Smartphone size={32} aria-hidden="true" />
              ) : (
                <Image
                  unoptimized
                  src="/technician-download-qr.png"
                  alt="QR code to open this download page on your phone"
                  width={112}
                  height={112}
                  onError={() => setQrFailed(true)}
                />
              )}
            </div>
            <p>
              {qrFailed
                ? "Open kbi.services/download on your phone."
                : "Scan to open on your phone"}
            </p>
          </div>
          <p role="status" className={styles.copyStatus}>
            {copyStatus}
          </p>
          <div className={styles.iosRow}>
            <Smartphone size={17} aria-hidden="true" />
            <span>iPhone</span>
            <span className={styles.comingSoon}>Registered devices</span>
          </div>
          <a href={release.iosUrl} className={styles.iosDownload} data-testid="ios-download">
            Download iPhone test build (.ipa)
            <ArrowDown size={17} aria-hidden="true" />
          </a>
          <p className={styles.iosNote}>
            Version {release.version} · For iPhones already registered with KBI.
            Download on a Mac and install with Apple Configurator or Xcode.
            This file does not install directly from Safari. Public TestFlight
            access isn’t available yet.
          </p>
        </section>

        <p className={styles.official}>
          <ShieldCheck size={15} aria-hidden="true" /> Official KBI download.
          Sign in with your technician account.
        </p>

        <details ref={installation} id="installation" className={styles.help}>
          <summary>
            Installation & help <ChevronDown size={17} aria-hidden="true" />
          </summary>
          <div className={styles.helpContent}>
            <h2>Ready in three simple steps.</h2>
            <ol>
              <li>
                <strong>Download</strong>
                <p>
                  Open the downloaded APK from your phone’s Downloads folder.
                </p>
              </li>
              <li>
                <strong>Install</strong>
                <p>
                  If prompted, allow this browser to install the app in
                  Settings. Turn that permission off afterwards and keep Play
                  Protect enabled.
                </p>
              </li>
              <li>
                <strong>Sign in</strong>
                <p>
                  Use your registered email and password. New accounts need
                  admin approval before receiving jobs.
                </p>
              </li>
            </ol>
            <details>
              <summary>
                Installing on iPhone
                <ChevronDown size={15} aria-hidden="true" />
              </summary>
              <p>
                Contact KBI to confirm your iPhone is registered before downloading.
                Connect it to a Mac, unlock and trust the Mac, then add the IPA in
                Apple Configurator or Xcode. Developer Mode must be enabled for this
                development build. Android APK files cannot be installed on iPhone.
              </p>
              <p>
                <a href="https://developer.apple.com/documentation/xcode/distributing-your-app-to-registered-devices"
                  target="_blank" rel="noopener noreferrer">Apple’s registered-device installation guide</a>
              </p>
            </details>
            <details>
              <summary>
                Already have the app?
                <ChevronDown size={15} aria-hidden="true" />
              </summary>
              <p>
                Install this version over your existing app. Do not uninstall
                first. If Android reports a signature conflict, contact support
                before removing the app.
              </p>
            </details>
            <details>
              <summary>
                Can’t sign in?
                <ChevronDown size={15} aria-hidden="true" />
              </summary>
              <p>
                Check your registered email or use the password-reset option in
                the app. Contact support if your account is awaiting approval.
              </p>
            </details>
            <p className={styles.safety}>
              Download only from this official page. If you are unsure about a
              security warning, contact KBI support. Never share your password
              with unverified contacts.
            </p>
          </div>
        </details>
      </main>

      <footer className={styles.footer}>
        <span>© {new Date().getFullYear()} KBI Services</span>
        <nav aria-label="Footer">
          <a href="/privacy">Privacy</a>
          <a href="/">
            Website <ArrowUpRight size={13} aria-hidden="true" />
          </a>
        </nav>
      </footer>
    </div>
  );
}
