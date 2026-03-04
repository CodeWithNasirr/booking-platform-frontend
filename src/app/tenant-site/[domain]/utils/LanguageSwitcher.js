'use client';

import { Globe } from 'lucide-react';
import { useTenantLang } from '../../contexts/TenantLangContext';
export default function LanguageSwitcher() {
  
    const { language, setLanguage } = useTenantLang();
    
  const languages = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'ar', label: 'العربية', flag: '🇸🇦' },
    { code: 'ur', label: 'اردو', flag: '🇵🇰' },
  ];

  return (
    <div className="relative group">
      <button className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all">
        <Globe className="w-4 h-4 text-blue-600" />
        <span className="text-sm hidden sm:inline">
          {languages.find(l => l.code === language)?.label}
        </span>
      </button>
      
      <div className="absolute top-full mt-2 right-0 w-48 bg-white rounded-xl border border-gray-200 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors first:rounded-t-xl last:rounded-b-xl ${
              language === lang.code ? 'bg-blue-50 text-blue-600' : ''
            }`}
          >
            <span className="text-xl">{lang.flag}</span>
            <span className="text-sm">{lang.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
