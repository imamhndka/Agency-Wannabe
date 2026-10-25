// JADI.in Hub — constants.js
const DEFAULT_PICS = [
    { id: 'pic_1', name: 'Imam', role: 'Founder & Director', email: 'imam@jadi.in', phone: '6281234567890', isDummy: false },
    { id: 'pic_2', name: 'Sarah', role: 'Project Manager', email: 'pm1@jadi.in', phone: '6281234567891', isDummy: false },
    { id: 'pic_3', name: 'Lingga', role: 'Account Executive', email: 'ae@jadi.in', phone: '6281234567892', isDummy: false }
];

const DEFAULT_VENDOR_CATEGORIES = [
    'Percetakan / Printing', 'Studio & Production', 'Legal & Notaris', 'Event & Venue',
    'Hotel & Akomodasi', 'Wedding', 'Social Space / Co-working', 'Katering', 'Transportasi'
];

const DEFAULT_SETTINGS = {
    companyName: 'JADI.in',
    tagline: 'Digital Partner · Solusi Layanan Terpadu',
    contact: 'Jakarta, Indonesia',
    bankName: 'Bank BCA',
    bankAccount: '',
    bankHolder: 'JADI.in Digital Partner',
    vendorCategories: DEFAULT_VENDOR_CATEGORIES
};

const RESEARCH_STATUSES = ['NOT_STARTED', 'IN_PROGRESS', 'DONE'];

const SAMPLE_DEMO_RESEARCH = [
    { id: 'demo_r1', title: 'Perbandingan venue gathering 150 orang', topic: 'Venue', status: 'IN_PROGRESS', projectId: '', author: 'Imam', date: '2026-10-20', link: '', summary: '3 venue disurvei di Jakarta Selatan. Kisaran harga Rp 250-400rb/pax termasuk makan siang.', isDummy: true }
];

const SAMPLE_DEMO_PROJECTS = [
    { id: 'demo_p1', client: 'PT Digital Nusantara', title: 'Rebrand & Modern Web Development', pic: 'Imam', category: 'Web Dev', revenue: 35000000, cost: 18000000, freelancer: 'Budi Santoso', deadline: '2026-10-25', status: 'In Progress', isDummy: true, logs: [{ id: 'l1', date: '2026-10-08', pic: 'Imam', note: 'Kickoff meeting selesai, struktur sitemap disetujui.', statusUpdate: 'In Progress' }] },
    { id: 'demo_p2', client: 'Warung Kopi Maju', title: 'Social Media Retainer Q4', pic: 'Sarah', category: 'Marketing', revenue: 12000000, cost: 6500000, freelancer: 'Rina Melati', deadline: '2026-11-01', status: 'In Progress', isDummy: true, logs: [] },
    { id: 'demo_p3', client: 'CV Creative Studio', title: 'Company Video Teaser', pic: 'Lingga', category: 'Video', revenue: 18000000, cost: 11000000, freelancer: 'Dimas Prasetyo', deadline: '2026-10-15', status: 'In Review', isDummy: true, logs: [] }
];

const SAMPLE_DEMO_FREELANCERS = [
    { id: 'demo_f1', name: 'Budi Santoso', skill: 'Web Dev', rate: 'Rp 5.000.000 / Proyek', phone: '6281234567891', rating: 4.9, status: 'Available', isDummy: true },
    { id: 'demo_f2', name: 'Rina Melati', skill: 'Marketing', rate: 'Rp 300.000 / Jam', phone: '6281234567892', rating: 4.8, status: 'Busy', isDummy: true }
];

const SAMPLE_DEMO_VENDORS = [
    { id: 'demo_v1', name: 'PT Prima Cetak Grafika', category: 'Percetakan / Printing', pic: 'Agus Raharjo', phone: '6281299887711', email: 'order@primacetak.co.id', location: 'Jakarta Selatan', tier: '$$', rating: 4.9, cost: 4000000, notes: 'Spesialis offset print & packaging.', status: 'Preferred Partner', isDummy: true }
];

// ---------- Phase 2/3 data ----------
const TASK_STATUSES = ['NOT_STARTED', 'IN_PROGRESS', 'DONE'];
const QUOTE_STATUSES = ['PENDING', 'SELECTED', 'REJECTED'];
const INVOICE_STATUSES = ['DRAFT', 'SENT', 'PAID'];
const PROJECT_STATUSES = ['Lead / Pitching', 'In Progress', 'In Review', 'Invoiced', 'Completed'];

const SAMPLE_DEMO_QUOTES = [
    { id: 'demo_q1', projectId: 'demo_p1', need: 'Web Development', partnerType: 'freelancer', partnerId: 'demo_f1', partnerName: 'Budi Santoso', amount: 15000000, notes: 'Termasuk 2x revisi', link: '', status: 'SELECTED', rating: 0, review: '', isDummy: true },
    { id: 'demo_q2', projectId: 'demo_p1', need: 'Cetak Company Profile', partnerType: 'vendor', partnerId: 'demo_v1', partnerName: 'PT Prima Cetak Grafika', amount: 3000000, notes: '500 eksemplar, art paper 150gr', link: '', status: 'SELECTED', rating: 5, review: 'Tepat waktu, hasil rapi.', isDummy: true },
    { id: 'demo_q3', projectId: 'demo_p1', need: 'Cetak Company Profile', partnerType: 'other', partnerId: '', partnerName: 'Percetakan Sinar', amount: 3600000, notes: '', link: '', status: 'REJECTED', rating: 0, review: '', isDummy: true }
];

const SAMPLE_DEMO_TASKS = [
    { id: 'demo_t1', projectId: 'demo_p1', title: 'Kickoff & sitemap', status: 'DONE', assignee: 'Imam', dueDate: '2026-10-08', isDummy: true },
    { id: 'demo_t2', projectId: 'demo_p1', title: 'Desain homepage', status: 'IN_PROGRESS', assignee: 'Sarah', dueDate: '2026-10-20', isDummy: true },
    { id: 'demo_t3', projectId: 'demo_p1', title: 'Launch & serah terima', status: 'NOT_STARTED', assignee: 'Imam', dueDate: '2026-10-30', isDummy: true }
];

const SAMPLE_DEMO_INVOICES = [
    { id: 'demo_i1', number: 'INV/2026/001', projectId: 'demo_p3', client: 'CV Creative Studio', date: '2026-10-10', dueDate: '2026-10-24', items: [{ desc: 'Company Video Teaser (60 detik)', qty: 1, price: 18000000 }], discount: 0, taxPercent: 11, billPercent: 50, billLabel: 'DP 50%', notes: '', status: 'SENT', paidDate: '', isDummy: true }
];
