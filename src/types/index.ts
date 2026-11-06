export interface User {
  user_id: number;
  email: string;
  role: 'admin' | 'doctor' | 'patient';
  ref_id: string | null;
  name?: string;
}

export interface Patient {
  p_id: string;
  f_name: string;
  l_name: string;
  email: string;
  gender: 'Male' | 'Female' | 'Other';
  blood_group: string;
  dob: string;
  age?: number;
  street: string;
  city: string;
  pincode: string;
  created_at?: string;
  appointment_count?: number;
}

export interface Doctor {
  id: string;
  f_name: string;
  l_name: string;
  email: string;
  qualification: string;
  experience: number;
  consult_fee: number;
  city: string;
  pincode: string;
  status: 'Active' | 'Inactive';
  created_at?: string;
  phone_numbers?: string | string[];
  total_consultations?: number;
  available_slots?: DoctorAvailability[];
}

export interface DoctorAvailability {
  availability_id: number;
  doctor_id: string;
  date: string;
  st_time: string;
  end_time: string;
  status: 'Available' | 'Booked' | 'Unavailable';
}

export interface Appointment {
  appointment_id: number;
  p_id: string;
  patient_name?: string;
  patient_gender?: string;
  patient_blood_group?: string;
  patient_age?: number;
  patient_email?: string;
  patient_city?: string;
  doctor_id: string;
  doctor_name?: string;
  doctor_qualification?: string;
  consult_fee?: number;
  appointment_date: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled' | 'In-Progress';
  created_at?: string;
  pers_id?: number;
  bill_id?: number;
  bill_amount?: number;
  bill_discount?: number;
  bill_status?: 'Pending' | 'Paid' | 'Partially Paid' | 'Cancelled';
}

export interface Medicine {
  id: number;
  name: string;
  category: string;
  price: number;
  in_stock: number;
  created_at?: string;
}

export interface PrescribedMedicine {
  medicine_id: number;
  name?: string;
  category?: string;
  price?: number;
  dosage: string;
  frequency: string;
  duration_days: number;
  instruction: string;
}

export interface Prescription {
  pers_id: number;
  appointment_id: number;
  symptoms: string;
  diagnosis: string;
  prescribed_date: string;
  follow_up_date?: string | null;
  patient_name?: string;
  patient_age?: number;
  patient_gender?: string;
  doctor_name?: string;
  doctor_qualification?: string;
  bill_id?: number;
  bill_amount?: number;
  bill_status?: string;
  medicines?: PrescribedMedicine[];
}

export interface Bill {
  bill_id: number;
  appointment_id: number;
  bill_date: string;
  amount: number;
  discount: number;
  status: 'Pending' | 'Paid' | 'Partially Paid' | 'Cancelled';
  created_at?: string;
  final_payable?: number;
  patient_name?: string;
  patient_email?: string;
  doctor_name?: string;
  consult_fee?: number;
  total_paid?: number;
  payments?: Payment[];
}

export interface Payment {
  payment_id: number;
  bill_id: number;
  utr: string;
  method: 'UPI' | 'Card' | 'Net Banking';
  amount: number;
  status: 'Success' | 'Pending' | 'Failed';
  payment_date?: string;
}

export interface LabReport {
  _id?: string;
  report_id: string;
  patient_id: string;
  appointment_id?: number | null;
  report_type: string;
  uploaded_date: string;
  test_results: Record<string, any>;
  doctor_comments?: string | null;
  report_status: 'Normal' | 'Abnormal' | 'Critical' | 'Borderline' | 'Pending Review';
  file_url?: string;
}

export interface PatientReview {
  _id?: string;
  review_id: string;
  patient_id: string;
  doctor_id: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface AuditLog {
  _id?: string;
  log_id: string;
  user_id: string;
  role: string;
  action: string;
  collection_or_table: string;
  record_id?: any;
  timestamp: string;
  additional_details?: any;
}
