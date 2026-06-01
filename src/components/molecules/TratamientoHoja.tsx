import { useAuth } from '@/context/AuthContext';

interface TratamientoHojaProps {
  value: string;
  onChange: (value: string) => void;
}

export const TratamientoHoja: React.FC<TratamientoHojaProps> = ({ value, onChange }) => {
  const { veterinaria } = useAuth();

  return (
    <div className="flex flex-col gap-2 mt-4">
      <label className="text-sm font-medium text-gray-700">Tratamiento *</label>

      <div
        id="hoja-tratamiento"
        className="w-full bg-white border border-gray-300 shadow-sm rounded-md overflow-hidden flex flex-col relative"
        style={{ minHeight: '400px' }}
      >
        <div className="px-6 py-4 flex justify-between items-center bg-white">
          <div className="flex items-center gap-2">
            <div className="w-16">
              <img src={veterinaria?.logoUrl} alt="Logo" className="w-full h-auto object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="text-[#2B3B60] font-semibold text-lg leading-tight tracking-tight">Veterinaria</span>
              <span className="text-[#842A64] font-black text-2xl leading-none tracking-tighter">KACHORRO'S</span>
            </div>
          </div>

          <div className="text-right">
            <h4 className="text-sm font-bold text-gray-800">Inversiones Kachorro's S.A de C.V</h4>
            <div className="text-xs text-gray-600 flex items-center justify-end gap-3 mt-1">
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M20 15.5c-1.25 0-2.45-.2-3.57-.57-.35-.11-.74-.03-1.02.24l-2.2 2.2c-2.83-1.44-5.15-3.75-6.59-6.59l2.2-2.21c.28-.26.36-.65.25-1C8.7 6.45 8.5 5.25 8.5 4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.5c0-.55-.45-1-1-1z"></path></svg>
                +503 7315 8160
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M20 15.5c-1.25 0-2.45-.2-3.57-.57-.35-.11-.74-.03-1.02.24l-2.2 2.2c-2.83-1.44-5.15-3.75-6.59-6.59l2.2-2.21c.28-.26.36-.65.25-1C8.7 6.45 8.5 5.25 8.5 4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.5c0-.55-.45-1-1-1z"></path></svg>
                2220 9679
              </span>
            </div>
          </div>
        </div>

        <div className="w-full h-[2px] bg-[#5A1846]"></div>

        <textarea
          className="flex-grow w-full p-6 text-gray-700 resize-y focus:outline-none focus:ring-0 border-none bg-transparent"
          placeholder="Describa el tratamiento indicado..."
          style={{ minHeight: '250px' }}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />

        <div className="mt-auto">
          <div className="w-full h-[1px] bg-[#5A1846] mb-1"></div>
          <p className="text-center text-[10px] text-gray-800 font-medium pb-2 pt-1">
            AV. MONTECRISTO POLIG. C, COL. MONTEBELLO, # 1-A, MEJICANOS, SAN SALVADOR
          </p>
          <div className="w-full bg-[#5A1846] text-white py-2 px-4 flex justify-between items-center">
            <div className="flex items-center gap-1">
              <span className="bg-white text-[#5A1846] rounded-full w-3.5 h-3.5 flex items-center justify-center font-black text-[10px]">f</span>
              <span className="text-[10px]">Veterinaria Kachorro's Montebello</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="bg-white rounded-sm w-3.5 h-3.5 flex items-center justify-center">
                <svg className="w-2.5 h-2.5 text-[#5A1846]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                </svg>
              </span>
              <span className="text-[10px]">vetkachorrosv</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="bg-white rounded-sm w-3.5 h-3.5 flex items-center justify-center">
                <svg className="w-2.5 h-2.5 text-[#5A1846]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.9 2.89 2.89 0 0 1-2.88-2.89 2.89 2.89 0 0 1 2.88-2.89c.36 0 .69.08 1 .2v-3.5a6.37 6.37 0 0 0-1-.08A6.33 6.33 0 0 0 2 15.74a6.33 6.33 0 0 0 6.38 6.29 6.33 6.33 0 0 0 6.38-6.29V9.64c.9.66 2 1.06 3.23 1.06h.45v-3.5c-.68 0-1.35-.2-1.95-.51z"/>
                </svg>
              </span>
              <span className="text-[10px]">vet_kachorros</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="bg-white rounded-sm w-3.5 h-3.5 flex items-center justify-center">
                <svg className="w-2.5 h-2.5 text-[#5A1846]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
              </span>
              <span className="text-[10px]">www.kachorrosss.click</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
