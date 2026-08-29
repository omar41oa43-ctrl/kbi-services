import type { Metadata } from "next"
import Link from "next/link"
import { FileCheck2, Mail, Phone } from "lucide-react"
import { getSiteContact } from "@/lib/site-contact"

export const revalidate = 3600

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "Read the terms and conditions governing repair, technician, payment, warranty and on-site services provided by KBI Services.",
  alternates: { canonical: "/terms" },
  openGraph: {
    title: "Terms & Conditions | KBI Services",
    description: "Read the terms and conditions governing repair, technician, payment, warranty and on-site services provided by KBI Services.",
    url: "/terms",
    type: "website",
  },
}

const sections = [
  {
    title: "1. Scope and acceptance",
    titleAr: "1. نطاق الشروط والموافقة",
    body: "These terms apply to bookings, diagnostics, on-site repairs, installations, maintenance, and corporate service requests provided by KBI Services, operated by KBI GLOBAL TECHNOLOGIES. By confirming a booking or approving a quotation, you accept the version of these terms available at that time.",
    bodyAr: "تسري هذه الشروط على الحجوزات والفحص والإصلاح الميداني والتركيب والصيانة وطلبات الشركات المقدمة من KBI Services، وتديرها KBI GLOBAL TECHNOLOGIES. بتأكيد الحجز أو الموافقة على عرض السعر، فإنك توافق على نسخة الشروط السارية في ذلك الوقت.",
  },
  {
    title: "2. Booking and service availability",
    titleAr: "2. الحجز وتوفر الخدمة",
    body: "A booking request is not a guaranteed appointment until KBI confirms the time and coverage. Same-day and emergency appointments depend on technician capacity, location, traffic, device condition, and parts availability. We may reschedule with notice when circumstances outside our control prevent attendance.",
    bodyAr: "طلب الحجز لا يُعد موعدًا مؤكدًا حتى تؤكد KBI الوقت والتغطية. تعتمد مواعيد اليوم نفسه والطوارئ على توفر الفني والموقع وحركة المرور وحالة الجهاز والقطع. وقد نعيد جدولة الموعد مع إشعارك إذا منعتنا ظروف خارجة عن السيطرة من الحضور.",
  },
  {
    title: "3. Diagnosis, quotations, and approval",
    titleAr: "3. الفحص وعرض السعر والموافقة",
    body: "Any estimate shown before inspection is indicative. After diagnosis, we provide the proposed work, available part option, price, expected timing, and applicable warranty. No paid repair begins until you approve the quotation. Additional faults discovered later require separate approval.",
    bodyAr: "أي تقدير قبل الفحص هو تقدير مبدئي. بعد التشخيص نوضح العمل المقترح وخيار القطعة والسعر والمدة المتوقعة والضمان المطبق. لا يبدأ أي إصلاح مدفوع قبل موافقتك على عرض السعر، وأي أعطال إضافية تُكتشف لاحقًا تحتاج إلى موافقة مستقلة.",
  },
  {
    title: "4. Visit, diagnosis, and cancellation fees",
    titleAr: "4. رسوم الزيارة والفحص والإلغاء",
    body: "The diagnosis may be free when the approved repair is completed. A visit, inspection, transport, or cancellation fee may apply when the repair is declined, the device is unavailable, access cannot be provided, or a confirmed appointment is cancelled late. Any applicable fee must be disclosed before dispatch or before diagnostic work begins.",
    bodyAr: "قد يكون الفحص مجانيًا عند تنفيذ الإصلاح المعتمد. وقد تطبق رسوم زيارة أو فحص أو نقل أو إلغاء إذا رُفض الإصلاح أو لم يكن الجهاز متاحًا أو تعذر الدخول إلى الموقع أو أُلغي موعد مؤكد متأخرًا. يجب توضيح أي رسوم مطبقة قبل إرسال الفني أو بدء الفحص.",
  },
  {
    title: "5. Parts and replaced components",
    titleAr: "5. القطع والمكونات المستبدلة",
    body: "Part options may include manufacturer-original, OEM-equivalent, refurbished, or compatible components depending on the device and supply. The selected grade must be identified in the quotation. Replaced parts are returned on request unless an exchange program, supplier condition, safety requirement, or legal restriction requires otherwise.",
    bodyAr: "قد تشمل خيارات القطع قطع الشركة المصنّعة أو ما يعادل OEM أو قطعًا مجددة أو متوافقة بحسب الجهاز والتوفر. يجب تحديد الفئة المختارة في عرض السعر. تُعاد القطع المستبدلة عند الطلب ما لم يمنع ذلك برنامج استبدال أو شرط مورد أو متطلب سلامة أو قيد قانوني.",
  },
  {
    title: "6. Warranty",
    titleAr: "6. الضمان",
    body: "Warranty eligibility, duration, and covered component are stated on the quotation, invoice, or warranty record. Unless expressly stated, warranty does not cover accidental or liquid damage, misuse, unauthorized later repair, software or data loss, consumables, unrelated faults, normal wear, or damage caused by unstable power or external equipment. Warranty service requires the order reference and reasonable access to inspect the device.",
    bodyAr: "تُحدد أهلية الضمان ومدته والقطعة المشمولة في عرض السعر أو الفاتورة أو سجل الضمان. ما لم يُذكر خلاف ذلك، لا يشمل الضمان أضرار الحوادث أو السوائل أو سوء الاستخدام أو إصلاحًا لاحقًا غير مصرح به أو فقدان البرامج والبيانات أو المواد الاستهلاكية أو الأعطال غير المرتبطة أو الاستهلاك الطبيعي أو الضرر الناتج عن الكهرباء أو معدات خارجية. تتطلب خدمة الضمان رقم الطلب وإتاحة الجهاز للفحص.",
  },
  {
    title: "7. Customer responsibilities and device data",
    titleAr: "7. مسؤوليات العميل وبيانات الجهاز",
    body: "You must provide accurate booking details, lawful access to the device and premises, a safe work area, and any passcode strictly required for an approved diagnostic step. Back up important data and remove confidential information where practical. Do not share account passwords unless a specific software task requires them; you may enter credentials yourself. KBI is not responsible for pre-existing faults or data loss not caused by proven negligence.",
    bodyAr: "يجب تقديم بيانات حجز صحيحة وإتاحة قانونية للجهاز والموقع ومكان عمل آمن، وأي رمز دخول مطلوب فقط لخطوة فحص معتمدة. احتفظ بنسخة احتياطية من البيانات المهمة وأزل المعلومات السرية متى أمكن. لا تشارك كلمات مرور الحسابات إلا إذا تطلبت مهمة برمجية محددة ذلك، ويمكنك إدخالها بنفسك. لا تتحمل KBI مسؤولية الأعطال السابقة أو فقدان البيانات غير الناتج عن إهمال مثبت.",
  },
  {
    title: "8. Payment, invoices, and ownership",
    titleAr: "8. الدفع والفواتير والملكية",
    body: "Payment is due after the approved work is completed unless a written corporate agreement states otherwise. Supported payment methods are confirmed at booking or invoicing. You confirm that you own the device or are authorized to request service for it. KBI may refuse work where ownership, safety, legality, or payment is reasonably in doubt.",
    bodyAr: "يستحق الدفع بعد إتمام العمل المعتمد ما لم ينص اتفاق شركات مكتوب على خلاف ذلك. تُحدد طرق الدفع المدعومة عند الحجز أو إصدار الفاتورة. وتؤكد أنك مالك الجهاز أو مخول بطلب الخدمة له. يحق لـKBI رفض العمل عند وجود شك معقول في الملكية أو السلامة أو المشروعية أو الدفع.",
  },
  {
    title: "9. Liability",
    titleAr: "9. المسؤولية",
    body: "To the extent permitted by UAE law, liability for a proven service failure is limited to re-performing the affected service, repairing the direct damage caused, or refunding the amount paid for that service, as appropriate. Nothing in these terms excludes liability that cannot legally be excluded.",
    bodyAr: "بالقدر الذي يسمح به قانون دولة الإمارات، تقتصر المسؤولية عن إخفاق مثبت في الخدمة على إعادة تنفيذ الخدمة المتأثرة أو إصلاح الضرر المباشر الناتج أو إعادة المبلغ المدفوع لتلك الخدمة، حسب الحالة. ولا تستبعد هذه الشروط أي مسؤولية لا يجوز قانونًا استبعادها.",
  },
  {
    title: "10. Privacy, complaints, and governing law",
    titleAr: "10. الخصوصية والشكاوى والقانون المطبق",
    body: "Personal information is handled under our Privacy Policy. Contact us promptly with a complaint and include the order reference and supporting details. These terms are governed by the applicable laws of the United Arab Emirates, and disputes are subject to the competent courts unless mandatory consumer law provides otherwise.",
    bodyAr: "تُعالج المعلومات الشخصية وفق سياسة الخصوصية. تواصل معنا سريعًا عند وجود شكوى وأرفق رقم الطلب والتفاصيل المؤيدة. تخضع هذه الشروط للقوانين المعمول بها في دولة الإمارات العربية المتحدة، وتختص بها المحاكم المختصة ما لم تقضِ قوانين حماية المستهلك الإلزامية بخلاف ذلك.",
  },
]

export default async function TermsPage() {
  const contact = await getSiteContact()

  return (
    <main className="adaptive-theme-page min-h-screen bg-[#070B14] px-4 py-20 text-slate-200 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-4xl">
        <header className="mb-10 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm font-bold text-cyan-300">
            <FileCheck2 className="h-4 w-4" /> Service agreement
          </div>
          <h1 className="text-3xl font-extrabold text-white sm:text-5xl">Terms &amp; Conditions <span lang="ar">· الشروط والأحكام</span></h1>
          <p className="mt-4 text-sm text-slate-400">Effective 27 August 2026 · United Arab Emirates</p>
        </header>

        <div className="space-y-5 rounded-3xl border border-slate-800 bg-slate-950/70 p-6 sm:p-10">
          {sections.map((section) => (
            <section key={section.title} className="border-b border-slate-800 pb-5 last:border-0 last:pb-0">
              <h2 className="text-lg font-bold text-white">{section.title}</h2>
              <p className="mt-2 leading-7 text-slate-300">{section.body}</p>
              <div lang="ar" dir="rtl" className="mt-4 border-t border-slate-800/70 pt-4 text-right">
                <h3 className="font-bold text-cyan-200">{section.titleAr}</h3>
                <p className="mt-2 leading-8 text-slate-300">{section.bodyAr}</p>
              </div>
            </section>
          ))}
        </div>

        <aside className="mt-8 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-6">
          <h2 className="font-bold text-white">Questions about these terms?</h2>
          <div className="mt-3 flex flex-col gap-2 text-sm text-slate-300 sm:flex-row sm:gap-6">
            <a className="inline-flex items-center gap-2 hover:text-cyan-300" href={`mailto:${contact.email}`}><Mail className="h-4 w-4" />{contact.email}</a>
            <a className="inline-flex items-center gap-2 hover:text-cyan-300" href={`tel:${contact.phone}`}><Phone className="h-4 w-4" />{contact.phoneDisplay}</a>
            <Link className="hover:text-cyan-300" href="/privacy">Privacy Policy</Link>
          </div>
        </aside>
      </div>
    </main>
  )
}
