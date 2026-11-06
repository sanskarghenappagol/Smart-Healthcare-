import React, { useState } from 'react';
import { Bill } from '../types';
import { api } from '../lib/api';
import { X, CreditCard, Smartphone, Building, CheckCircle2, RefreshCw, AlertCircle, Receipt } from 'lucide-react';

interface PaymentModalProps {
  bill: Bill | null;
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  bill,
  isOpen,
  onClose,
  onPaymentSuccess
}) => {
  if (!isOpen || !bill) return null;

  const netPayable = Math.max(0, bill.amount - bill.discount);
  const remaining = Math.max(0, netPayable - (bill.total_paid || 0));

  const [method, setMethod] = useState<'UPI' | 'Card' | 'Net Banking'>('UPI');
  const [amount, setAmount] = useState<number>(remaining > 0 ? remaining : netPayable);
  const [upiId, setUpiId] = useState('user@oksbi');
  const [cardNumber, setCardNumber] = useState('4111 2222 3333 4444');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('789');
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successReceipt, setSuccessReceipt] = useState<any>(null);

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await api.payBill({
        bill_id: bill.bill_id,
        method,
        amount: Number(amount)
      });
      setSuccessReceipt(res);
      onPaymentSuccess();
    } catch (err: any) {
      setError(err.message || 'Payment simulation failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleDone = () => {
    setSuccessReceipt(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-sky-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Healthcare Bill Payment #{bill.bill_id}
            </h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {successReceipt ? (
          /* Payment Success Receipt View */
          <div className="p-6 text-center space-y-4">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-bold text-slate-900">Payment Successful!</h4>
              <p className="text-xs text-slate-500">Transaction recorded in MySQL Payment table.</p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs font-mono text-left space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Payment Ref ID:</span>
                <span className="font-bold">#{successReceipt.payment_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">UTR Number:</span>
                <span className="font-bold text-sky-700">{successReceipt.utr}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Amount Paid:</span>
                <span className="font-bold text-emerald-700">Rs. {successReceipt.amount_paid}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Updated Bill Status:</span>
                <span className="font-bold text-sky-700 uppercase">{successReceipt.bill_status}</span>
              </div>
            </div>

            <button
              onClick={handleDone}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition-colors"
            >
              Close &amp; Return to Dashboard
            </button>
          </div>
        ) : (
          /* Payment Input Form */
          <form onSubmit={handlePay} className="p-6 space-y-5 text-xs">
            {/* Bill Summary Strip */}
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-slate-500 text-[11px] block">Patient / Doctor</span>
                <span className="font-semibold text-slate-800">
                  {bill.patient_name} · {bill.doctor_name}
                </span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 text-[11px] block">Net Payable</span>
                <span className="font-bold text-sm text-slate-900 tabular-nums">Rs. {remaining}</span>
              </div>
            </div>

            {/* Method Tabs */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700 block">Select Payment Method</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setMethod('UPI')}
                  className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                    method === 'UPI' ? 'border-sky-500 bg-sky-50/50 text-sky-700 font-bold' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                  <span className="text-[11px]">UPI (Instant)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMethod('Card')}
                  className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                    method === 'Card' ? 'border-sky-500 bg-sky-50/50 text-sky-700 font-bold' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span className="text-[11px]">Card (Debit/Credit)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMethod('Net Banking')}
                  className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                    method === 'Net Banking' ? 'border-sky-500 bg-sky-50/50 text-sky-700 font-bold' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Building className="w-4 h-4" />
                  <span className="text-[11px]">Net Banking</span>
                </button>
              </div>
            </div>

            {/* Dynamic Inputs according to Method */}
            {method === 'UPI' && (
              <div className="space-y-1">
                <label className="text-slate-600 block">Virtual Payment Address (VPA / UPI ID)</label>
                <input
                  type="text"
                  value={upiId}
                  onChange={e => setUpiId(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-sky-500"
                  placeholder="e.g. mobile@upi"
                />
              </div>
            )}

            {method === 'Card' && (
              <div className="space-y-3">
                <div>
                  <label className="text-slate-600 block mb-1">Card Number</label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={e => setCardNumber(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-600 block mb-1">Expiry</label>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={e => setCardExpiry(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-sky-500"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 block mb-1">CVV</label>
                    <input
                      type="password"
                      value={cardCvv}
                      onChange={e => setCardCvv(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-sky-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {method === 'Net Banking' && (
              <div className="space-y-1">
                <label className="text-slate-600 block">Select Authorized Bank</label>
                <select
                  value={selectedBank}
                  onChange={e => setSelectedBank(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-sky-500"
                >
                  <option value="HDFC Bank">HDFC Bank</option>
                  <option value="State Bank of India">State Bank of India (SBI)</option>
                  <option value="ICICI Bank">ICICI Bank</option>
                  <option value="Axis Bank">Axis Bank</option>
                  <option value="Canara Bank">Canara Bank</option>
                </select>
              </div>
            )}

            {/* Amount to Pay */}
            <div className="space-y-1">
              <label className="text-slate-600 block">Amount to Pay (Rs.)</label>
              <input
                type="number"
                value={amount}
                max={remaining}
                onChange={e => setAmount(Number(e.target.value))}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || amount <= 0}
              className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing Payment in MySQL...</span>
                </>
              ) : (
                <span>Confirm Payment of Rs. {amount}</span>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
