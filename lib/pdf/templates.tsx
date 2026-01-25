import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Image,
} from '@react-pdf/renderer';
import {
  FormType,
  FORM_TYPE_LABELS,
  QuoteData,
  WorkApprovalData,
  CompletionData,
  PaymentData,
  UNIT_LABELS,
  PAYMENT_METHOD_LABELS,
} from '@/types';

// Disable hyphenation callback to prevent errors
Font.registerHyphenationCallback((word) => [word]);

// Styles - using Helvetica (built-in font) for reliability
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 11,
  },
  header: {
    marginBottom: 20,
    borderBottom: '2px solid #0066cc',
    paddingBottom: 15,
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0066cc',
    textAlign: 'right',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 10,
    color: '#666',
    textAlign: 'right',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'right',
    marginBottom: 20,
    color: '#333',
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'right',
    color: '#333',
    backgroundColor: '#f5f5f5',
    padding: 8,
    borderRadius: 4,
  },
  row: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottom: '1px solid #eee',
  },
  label: {
    color: '#666',
    textAlign: 'right',
    flex: 1,
  },
  value: {
    fontWeight: 'bold',
    textAlign: 'left',
    flex: 1,
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row-reverse',
    backgroundColor: '#f5f5f5',
    padding: 8,
    borderRadius: 4,
    marginBottom: 5,
  },
  tableHeaderCell: {
    fontWeight: 'bold',
    fontSize: 10,
    color: '#333',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row-reverse',
    paddingVertical: 8,
    borderBottom: '1px solid #eee',
  },
  tableCell: {
    fontSize: 10,
    textAlign: 'center',
  },
  col5: { width: '35%', textAlign: 'right' },
  col2: { width: '15%' },
  col1: { width: '15%' },
  totalsSection: {
    marginTop: 15,
    paddingTop: 10,
    borderTop: '2px solid #333',
  },
  totalRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  grandTotal: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 10,
    paddingTop: 10,
    borderTop: '1px solid #333',
  },
  note: {
    fontSize: 10,
    color: '#666',
    textAlign: 'right',
    marginTop: 5,
    fontStyle: 'italic',
  },
  disclaimer: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#fff3cd',
    borderRadius: 4,
  },
  disclaimerText: {
    fontSize: 9,
    color: '#856404',
    textAlign: 'right',
    lineHeight: 1.5,
  },
  signatureSection: {
    marginTop: 30,
    padding: 15,
    backgroundColor: '#e8f5e9',
    borderRadius: 4,
  },
  signatureTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2e7d32',
    textAlign: 'right',
    marginBottom: 10,
  },
  signatureImage: {
    maxHeight: 60,
    marginVertical: 10,
  },
  signatureInfo: {
    fontSize: 10,
    color: '#666',
    textAlign: 'right',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#999',
    borderTop: '1px solid #eee',
    paddingTop: 10,
  },
  stars: {
    fontSize: 12,
  },
  ratingRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottom: '1px solid #eee',
  },
});

// Helper functions
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
  }).format(amount);
}

function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('he-IL');
}

function renderStars(rating: number): string {
  // Use simple characters that render reliably across fonts
  const filled = '*'.repeat(rating);
  const empty = '-'.repeat(5 - rating);
  return `[${filled}${empty}] ${rating}/5`;
}

// PDF Header Component
function PDFHeader({ title }: { title: string }) {
  return (
    <>
      <View style={styles.header}>
        <Text style={styles.logo}>ProjectSign</Text>
        <Text style={styles.subtitle}>מערכת חתימה דיגיטלית</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
    </>
  );
}

// Daniel Cut & Drill PDF Header Component
function DanielPDFHeader({ title }: { title: string }) {
  return (
    <>
      <View style={styles.header}>
        <Text style={styles.logo}>Daniel – Cut & Drill</Text>
        <Text style={styles.subtitle}>עיצובים מיוחדים באבן וקרמיקה | 054-7980580</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
    </>
  );
}

// PDF Footer Component
function PDFFooter() {
  return (
    <Text style={styles.footer}>
      מסמך זה נוצר באמצעות מערכת ProjectSign | {formatDate(new Date())}
    </Text>
  );
}

// Signature Section Component
function SignatureSection({
  signedAt,
  signedBy,
  signatureUrl,
}: {
  signedAt?: string;
  signedBy?: string;
  signatureUrl?: string;
}) {
  if (!signedAt) return null;

  // Only render image if we have a valid data URL (base64)
  const hasValidSignature = signatureUrl && signatureUrl.startsWith('data:image');

  return (
    <View style={styles.signatureSection}>
      <Text style={styles.signatureTitle}>חתימה דיגיטלית</Text>
      {hasValidSignature && (
        <Image src={signatureUrl} style={styles.signatureImage} />
      )}
      <Text style={styles.signatureInfo}>נחתם על ידי: {signedBy || 'לא זמין'}</Text>
      <Text style={styles.signatureInfo}>בתאריך: {formatDate(signedAt)}</Text>
    </View>
  );
}

// Quote PDF Template
export function QuotePDF({
  data,
  projectName,
  contactName,
  signedAt,
  signedBy,
  signatureUrl,
}: {
  data: QuoteData;
  projectName: string;
  contactName?: string;
  signedAt?: string;
  signedBy?: string;
  signatureUrl?: string;
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <PDFHeader title={`הצעת מחיר - ${projectName}`} />

        {contactName && (
          <View style={styles.section}>
            <Text style={{ textAlign: 'right', marginBottom: 10 }}>
              לכבוד: {contactName}
            </Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>פריטים</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, styles.col5]}>תיאור</Text>
              <Text style={[styles.tableHeaderCell, styles.col2]}>כמות</Text>
              <Text style={[styles.tableHeaderCell, styles.col2]}>יחידה</Text>
              <Text style={[styles.tableHeaderCell, styles.col1]}>מחיר</Text>
              <Text style={[styles.tableHeaderCell, styles.col2]}>סה״כ</Text>
            </View>
            {data.items?.map((item, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.col5]}>{item.description}</Text>
                <Text style={[styles.tableCell, styles.col2]}>{item.quantity}</Text>
                <Text style={[styles.tableCell, styles.col2]}>
                  {UNIT_LABELS[item.unit] || item.unit}
                </Text>
                <Text style={[styles.tableCell, styles.col1]}>
                  {formatCurrency(item.unit_price)}
                </Text>
                <Text style={[styles.tableCell, styles.col2]}>
                  {formatCurrency(item.total)}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.totalsSection}>
            <View style={styles.totalRow}>
              <Text style={styles.label}>סה״כ לפני מע״מ:</Text>
              <Text style={styles.value}>{formatCurrency(data.subtotal)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.label}>מע״מ ({(data.vat_rate * 100).toFixed(0)}%):</Text>
              <Text style={styles.value}>{formatCurrency(data.vat_amount)}</Text>
            </View>
            <View style={[styles.totalRow, styles.grandTotal]}>
              <Text style={styles.label}>סה״כ לתשלום:</Text>
              <Text style={styles.value}>{formatCurrency(data.total)}</Text>
            </View>
          </View>
        </View>

        {data.valid_until && (
          <View style={styles.row}>
            <Text style={styles.label}>תוקף ההצעה:</Text>
            <Text style={styles.value}>{formatDate(data.valid_until)}</Text>
          </View>
        )}

        {data.payment_terms && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>תנאי תשלום</Text>
            <Text style={styles.note}>{data.payment_terms}</Text>
          </View>
        )}

        {data.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>הערות</Text>
            <Text style={styles.note}>{data.notes}</Text>
          </View>
        )}

        {data.warranty_terms && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>תנאי אחריות</Text>
            <Text style={styles.note}>{data.warranty_terms}</Text>
          </View>
        )}

        <SignatureSection
          signedAt={signedAt}
          signedBy={signedBy}
          signatureUrl={signatureUrl}
        />

        <PDFFooter />
      </Page>
    </Document>
  );
}

// Work Approval PDF Template
export function WorkApprovalPDF({
  data,
  projectName,
  signedAt,
  signedBy,
  signatureUrl,
}: {
  data: WorkApprovalData;
  projectName: string;
  signedAt?: string;
  signedBy?: string;
  signatureUrl?: string;
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <DanielPDFHeader title="הזמנת עבודה" />

        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            אני הח״מ מאשר/ת כי עברתי עם המבצע על כל הצרכים, הדרישות והיקף העבודה,
            וקיבלתי הסבר מלא בנוגע לתשתיות הקיימות באתר, לרבות נקודות רגישות, סיכונים אפשריים
            והנחיות שיש לדעת לפני תחילת הקידוח ו/או ביצוע העבודה.
          </Text>
          <Text style={[styles.disclaimerText, { fontWeight: 'bold', marginTop: 5 }]}>
            הובהר לי כי האחריות על מסירת מידע מלא ומדויק בנוגע לתשתיות קיימות חלה עליי.
          </Text>
        </View>

        <View style={[styles.section, { marginTop: 20 }]}>
          <Text style={styles.sectionTitle}>פרטי הזמנת העבודה</Text>

          <View style={styles.row}>
            <Text style={styles.label}>שם האתר / כתובת:</Text>
            <Text style={styles.value}>{data.site_name}</Text>
          </View>

          {data.quote_reference && (
            <View style={styles.row}>
              <Text style={styles.label}>הצעת מחיר:</Text>
              <Text style={styles.value}>{data.quote_reference}</Text>
            </View>
          )}

          <View style={styles.row}>
            <Text style={styles.label}>תאריך תחילת ביצוע:</Text>
            <Text style={styles.value}>{formatDate(data.start_date)}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>איש קשר:</Text>
            <Text style={styles.value}>{data.contact_name}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>טלפון:</Text>
            <Text style={styles.value}>{data.contact_phone}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>פירוט העבודה</Text>
          <Text style={styles.note}>{data.work_details}</Text>
        </View>

        {data.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>הערות</Text>
            <Text style={styles.note}>{data.notes}</Text>
          </View>
        )}

        {data.additions && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>תוספות</Text>
            <Text style={styles.note}>{data.additions}</Text>
          </View>
        )}

        <SignatureSection
          signedAt={signedAt}
          signedBy={signedBy}
          signatureUrl={signatureUrl}
        />

        <PDFFooter />
      </Page>
    </Document>
  );
}

// Completion PDF Template
export function CompletionPDF({
  data,
  projectName,
  signedAt,
  signedBy,
  signatureUrl,
}: {
  data: CompletionData;
  projectName: string;
  signedAt?: string;
  signedBy?: string;
  signatureUrl?: string;
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <DanielPDFHeader title="טופס הגשת עבודה ושביעות רצון לקוח" />

        <View style={[styles.section, { marginTop: 20 }]}>
          <Text style={styles.sectionTitle}>פרטי ההזמנה</Text>

          <View style={styles.row}>
            <Text style={styles.label}>שם אתר / כתובת:</Text>
            <Text style={styles.value}>{data.site_name}</Text>
          </View>

          {data.order_number && (
            <View style={styles.row}>
              <Text style={styles.label}>מס׳ הזמנה (אם קיים):</Text>
              <Text style={styles.value}>{data.order_number}</Text>
            </View>
          )}

          <View style={styles.row}>
            <Text style={styles.label}>תאריך ביצוע העבודה:</Text>
            <Text style={styles.value}>{formatDate(data.work_date)}</Text>
          </View>
        </View>

        <View style={[styles.disclaimer, { backgroundColor: '#e8f5e9' }]}>
          <Text style={[styles.disclaimerText, { color: '#2e7d32', fontWeight: 'bold' }]}>
            הצהרת הלקוח
          </Text>
          <Text style={[styles.disclaimerText, { color: '#2e7d32', marginTop: 5 }]}>
            אני החתום/ה מטה מאשר/ת כי העבודה בוצעה והוגשה בהתאם להזמנה, להסכמות ולתנאי האתר,
            ונמסרה לשביעות רצוני המלאה במועד סיום העבודה.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>דירוג שביעות רצון (1 = לא מרוצה כלל | 5 = מרוצה מאוד)</Text>

          <View style={styles.ratingRow}>
            <Text style={styles.label}>שביעות רצון כללית</Text>
            <Text style={styles.stars}>{renderStars(data.satisfaction_overall)}</Text>
          </View>

          <View style={styles.ratingRow}>
            <Text style={styles.label}>התנהלות באתר העבודה</Text>
            <Text style={styles.stars}>{renderStars(data.satisfaction_site_conduct)}</Text>
          </View>

          <View style={styles.ratingRow}>
            <Text style={styles.label}>איכות ביצוע העבודה</Text>
            <Text style={styles.stars}>{renderStars(data.satisfaction_work_quality)}</Text>
          </View>

          <View style={styles.ratingRow}>
            <Text style={styles.label}>נראות וגימור העבודה</Text>
            <Text style={styles.stars}>{renderStars(data.satisfaction_appearance)}</Text>
          </View>

          <View style={styles.ratingRow}>
            <Text style={styles.label}>התנהגות איש הביצוע</Text>
            <Text style={styles.stars}>{renderStars(data.satisfaction_worker_behavior)}</Text>
          </View>
        </View>

        {data.feedback_notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>הערות / משוב</Text>
            <Text style={styles.note}>{data.feedback_notes}</Text>
          </View>
        )}

        <View style={[styles.disclaimer, { backgroundColor: '#fff3cd' }]}>
          <Text style={[styles.disclaimerText, { color: '#856404', fontWeight: 'bold' }]}>
            סעיף הגנה והיעדר טענות עתידיות
          </Text>
          <Text style={[styles.disclaimerText, { color: '#856404', marginTop: 5 }]}>
            הלקוח מצהיר כי בדק את העבודה במועד מסירתה, כי לא נמצאו ליקויים גלויים לעין,
            וכי ידוע לו שמדובר בעבודות באבן, קרמיקה, שיש ופורצלן אשר מטבעם עלולים לכלול
            שברים נסתרים, מאמצים פנימיים או רגישויות חומריות שאינן ניתנות לזיהוי מראש.
          </Text>
          <Text style={[styles.disclaimerText, { color: '#856404', marginTop: 5 }]}>
            לאחר חתימה על טופס זה, הלקוח מוותר על כל טענה, דרישה או תביעה עתידית בגין
            סדקים, שברים או נזקים הנובעים מתכונות החומר, תשתיות קיימות, עבודות קודמות,
            התקנה או שימוש שבוצעו על ידי צד ג׳.
          </Text>
          <Text style={[styles.disclaimerText, { color: '#856404', marginTop: 5, fontWeight: 'bold' }]}>
            אחריות החברה חלה אך ורק על ביצוע העבודה כפי שנמסרה במועד סיומה.
          </Text>
        </View>

        <View style={[styles.disclaimer, { backgroundColor: '#e3f2fd' }]}>
          <Text style={[styles.disclaimerText, { color: '#1565c0', fontWeight: 'bold' }]}>
            אישור הלקוח
          </Text>
          <Text style={[styles.disclaimerText, { color: '#1565c0', marginTop: 5 }]}>
            אני מאשר/ת כי קראתי, הבנתי והסכמתי לכל האמור לעיל, וכי אין לי ולא יהיו לי טענות נוספות לאחר מועד החתימה.
          </Text>
        </View>

        <SignatureSection
          signedAt={signedAt}
          signedBy={signedBy}
          signatureUrl={signatureUrl}
        />

        <PDFFooter />
      </Page>
    </Document>
  );
}

// Payment PDF Template
export function PaymentPDF({
  data,
  projectName,
  signedAt,
  signedBy,
  signatureUrl,
}: {
  data: PaymentData;
  projectName: string;
  signedAt?: string;
  signedBy?: string;
  signatureUrl?: string;
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <PDFHeader title={`אישור תשלום - ${projectName}`} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>פרטי התשלום</Text>

          <View style={styles.row}>
            <Text style={styles.label}>סכום לתשלום:</Text>
            <Text style={styles.value}>{formatCurrency(data.amount_due)}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>סכום ששולם:</Text>
            <Text style={[styles.value, { color: '#2e7d32' }]}>
              {formatCurrency(data.amount_paid)}
            </Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>יתרה:</Text>
            <Text style={[
              styles.value,
              { color: data.remaining_balance > 0 ? '#f57c00' : '#2e7d32' }
            ]}>
              {formatCurrency(data.remaining_balance)}
            </Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>אמצעי תשלום:</Text>
            <Text style={styles.value}>{PAYMENT_METHOD_LABELS[data.payment_method]}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>תאריך תשלום:</Text>
            <Text style={styles.value}>{formatDate(data.paid_at)}</Text>
          </View>

          {data.reference_number && (
            <View style={styles.row}>
              <Text style={styles.label}>מספר אסמכתא:</Text>
              <Text style={styles.value}>{data.reference_number}</Text>
            </View>
          )}

          {data.receipt_number && (
            <View style={styles.row}>
              <Text style={styles.label}>מספר קבלה:</Text>
              <Text style={styles.value}>{data.receipt_number}</Text>
            </View>
          )}
        </View>

        {data.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>הערות</Text>
            <Text style={styles.note}>{data.notes}</Text>
          </View>
        )}

        <SignatureSection
          signedAt={signedAt}
          signedBy={signedBy}
          signatureUrl={signatureUrl}
        />

        <PDFFooter />
      </Page>
    </Document>
  );
}

// Main export function to generate PDF by form type
export function getFormPDFTemplate(
  formType: FormType,
  data: QuoteData | WorkApprovalData | CompletionData | PaymentData,
  projectName: string,
  contactName?: string,
  signedAt?: string,
  signedBy?: string,
  signatureUrl?: string
) {
  switch (formType) {
    case 'quote':
      return (
        <QuotePDF
          data={data as QuoteData}
          projectName={projectName}
          contactName={contactName}
          signedAt={signedAt}
          signedBy={signedBy}
          signatureUrl={signatureUrl}
        />
      );
    case 'work_approval':
      return (
        <WorkApprovalPDF
          data={data as WorkApprovalData}
          projectName={projectName}
          signedAt={signedAt}
          signedBy={signedBy}
          signatureUrl={signatureUrl}
        />
      );
    case 'completion':
      return (
        <CompletionPDF
          data={data as CompletionData}
          projectName={projectName}
          signedAt={signedAt}
          signedBy={signedBy}
          signatureUrl={signatureUrl}
        />
      );
    case 'payment':
      return (
        <PaymentPDF
          data={data as PaymentData}
          projectName={projectName}
          signedAt={signedAt}
          signedBy={signedBy}
          signatureUrl={signatureUrl}
        />
      );
    default:
      throw new Error(`Unknown form type: ${formType}`);
  }
}
