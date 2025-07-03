'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { ChromePicker, ColorResult } from 'react-color';
import { AppearanceOptions, ExternalWallet, LoginOptions, OtpLoginOption, SocialLogin, ThemeVariables, VendorInfo } from '@okto_web3/react-sdk';
import { defaultDarkAppearanceOptions, defaultLightAppearanceOptions } from '../constants';

interface OnboardingConfiguratorProps {
  themeConfig: AppearanceOptions;
  setThemeConfig: React.Dispatch<React.SetStateAction<AppearanceOptions>>;
}

// Default to dark theme for blockchain aesthetic
export const defaultAppearanceOptions = defaultDarkAppearanceOptions;

// Blockchain-themed color palette
const blockchainColors = {
  primary: '#6e42e5', // Vibrant purple
  secondary: '#42c8e5', // Cyan
  accent: '#42e57f', // Neo green
  background: '#0a0e17', // Deep space
  cardBg: '#141925', // Dark slate
  text: '#e5e7eb', // Light gray
  muted: '#8b98b8', // Muted blue-gray
};

const OnboardingConfigurator = ({ themeConfig, setThemeConfig }: OnboardingConfiguratorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeColorPicker, setActiveColorPicker] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'appearance' | 'vendor' | 'login'>('appearance');

  // Apply theme variables to CSS
  useEffect(() => {
    if (typeof document !== 'undefined' && themeConfig.appearance?.theme) {
      const root = document.documentElement;
      Object.entries(themeConfig.appearance.theme).forEach(([key, value]) => {
        root.style.setProperty(key, value?.toString() || '');
      });
    }
  }, [themeConfig.appearance?.theme]);

  // Merge configs properly
  const config = useMemo(() => ({
    ...defaultAppearanceOptions,
    ...themeConfig,
    appearance: {
      ...defaultAppearanceOptions.appearance,
      ...themeConfig.appearance,
      theme: {
        ...defaultAppearanceOptions.appearance?.theme,
        ...themeConfig.appearance?.theme,
      }
    },
    loginOptions: {
      socialLogins: themeConfig.loginOptions?.socialLogins || [],
      otpLoginOptions: themeConfig.loginOptions?.otpLoginOptions || [],
      externalWallets: themeConfig.loginOptions?.externalWallets || [],
    }
  }), [themeConfig]);

  const handleThemeChange = useCallback((prop: keyof ThemeVariables, value: string) => {
    setThemeConfig(prev => ({
      ...prev,
      appearance: {
        ...prev.appearance,
        theme: {
          ...prev.appearance?.theme,
          [prop]: value
        }
      }
    }));
  }, [setThemeConfig]);

  const handleVendorChange = useCallback(<K extends keyof VendorInfo>(field: K, value: VendorInfo[K]) => {
    setThemeConfig(prev => ({
      ...prev,
      vendor: {
        ...prev.vendor,
        [field]: value
      }
    }));
  }, [setThemeConfig]);

  const toggleLoginOption = useCallback(<T extends SocialLogin['type'] | OtpLoginOption['type'] | ExternalWallet['type']>(
    category: keyof LoginOptions,
    type: T,
    enabled: boolean
  ) => {
    setThemeConfig(prev => {
      const currentOptions = prev.loginOptions?.[category] || [];
      const existingIndex = currentOptions.findIndex(item => item.type === type);

      if (enabled && existingIndex === -1) {
        return {
          ...prev,
          loginOptions: {
            ...prev.loginOptions,
            [category]: [
              ...currentOptions,
              { type, position: currentOptions.length + 1 }
            ]
          }
        };
      }

      if (!enabled && existingIndex !== -1) {
        return {
          ...prev,
          loginOptions: {
            ...prev.loginOptions,
            [category]: currentOptions.filter(item => item.type !== type)
          }
        };
      }

      return prev;
    });
  }, [setThemeConfig]);

  // Toggle between light and dark theme
  const toggleTheme = useCallback(() => {
    const isDarkTheme = config.appearance?.themeName === 'dark';
    const newThemePreset = isDarkTheme ? defaultLightAppearanceOptions : defaultDarkAppearanceOptions;
    
    setThemeConfig(prev => ({
      ...prev,
      appearance: {
        themeName: isDarkTheme ? 'light' : 'dark',
        theme: {
          ...newThemePreset.appearance?.theme
        }
      }
    }));
  }, [config.appearance?.themeName, setThemeConfig]);

  // Blockchain-themed button style
  type ButtonStyleProps = {
    children: React.ReactNode;
    onClick: React.MouseEventHandler<HTMLButtonElement>;
    variant?: 'primary' | 'secondary' | 'danger';
    className?: string;
  };

  const ButtonStyle = ({ children, onClick, variant = 'primary', className = '' }: ButtonStyleProps) => {
    const baseStyle = "relative overflow-hidden px-6 py-3 rounded-lg font-medium transition-all duration-300";
    const variants = {
      primary: `bg-gradient-to-r from-purple-600 to-blue-500 text-white ${className} hover:shadow-lg hover:shadow-purple-500/30`,
      secondary: `bg-gray-100 text-gray-800 border border-gray-300 ${className} hover:bg-gray-200`,
      danger: `bg-gradient-to-r from-red-500 to-pink-600 text-white ${className} hover:shadow-lg hover:shadow-red-500/30`,
    };

    return (
      <button
        onClick={onClick}
        className={`${baseStyle} ${variants[variant]}`}
      >
        <span className="relative z-10">{children}</span>
        <span className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-500/20 opacity-0 hover:opacity-100 transition-opacity duration-300"></span>
      </button>
    );
  };

  // Navigation item for sidebar
  const NavItem = ({ active, onClick, children }: {
    active: boolean;
    onClick: React.MouseEventHandler<HTMLButtonElement>;
    children: React.ReactNode;
  }) => {
    return (
      <button
        onClick={onClick}
        className={`w-full text-left px-4 py-3 mb-2 rounded-lg transition-all duration-300 font-medium ${
          active 
            ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20' 
            : 'text-gray-700 hover:bg-gray-100'
        }`}
      >
        {children}
      </button>
    );
  };

  return (
    <div className="relative">
      <ButtonStyle 
        onClick={() => setIsOpen(true)}
        variant="primary"
      >
        Customize Onboarding WebView
      </ButtonStyle>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[1000]">
          <div className="bg-white rounded-xl max-w-[950px] w-[95%] max-h-[90vh] overflow-hidden shadow-xl shadow-purple-900/10 relative flex">
            {/* Left sidebar navigation */}
            <div className="w-64 bg-gray-50 border-r border-gray-200 p-4 flex flex-col">
              <div className="mb-6 py-4">
                <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
                  Configuration
                </h2>
              </div>
              
              <nav className="flex-1">
                <NavItem 
                  active={activeTab === 'appearance'} 
                  onClick={() => setActiveTab('appearance')}
                >
                  Appearance
                </NavItem>
                <NavItem 
                  active={activeTab === 'vendor'} 
                  onClick={() => setActiveTab('vendor')}
                >
                  Vendor
                </NavItem>
                <NavItem 
                  active={activeTab === 'login'} 
                  onClick={() => setActiveTab('login')}
                >
                  Login Options
                </NavItem>
              </nav>
              
              <div className="mt-auto pt-4 border-t border-gray-200">
                <ButtonStyle
                  onClick={() => {
                    setThemeConfig(config.appearance?.themeName === 'dark' 
                      ? defaultDarkAppearanceOptions 
                      : defaultLightAppearanceOptions);
                  }}
                  variant="danger"
                  className="w-full mb-2"
                >
                  Reset
                </ButtonStyle>
              </div>
            </div>
            
            {/* Main content area */}
            <div className="flex-1 flex flex-col h-[90vh]">
              <div className="flex justify-between items-center p-4 border-b border-gray-200">
                <h1 className="text-xl font-bold text-gray-800">
                  {activeTab === 'appearance' && 'Appearance Settings'}
                  {activeTab === 'vendor' && 'Vendor Information'}
                  {activeTab === 'login' && 'Login Options'}
                </h1>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl p-2 hover:bg-gray-100 rounded-full transition-colors w-10 h-10 flex items-center justify-center"
                >
                  ×
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1">
                {/* Appearance Tab */}
                {activeTab === 'appearance' && (
                  <section className="space-y-6">
                    <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <label className="block mb-3 text-gray-700 font-medium">Theme Preset:</label>
                      <div className="flex items-center gap-4">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={config.appearance?.themeName === 'dark'}
                            onChange={toggleTheme}
                            className="sr-only peer"
                          />
                          <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-500 rounded-full peer peer-checked:bg-gradient-to-r from-purple-600 to-blue-500 relative">
                            <span
                              className={`absolute top-1 left-1 bg-white w-5 h-5 rounded-full transition-transform duration-300 ${
                                config.appearance?.themeName === 'dark' ? 'translate-x-7' : ''
                              }`}
                            />
                          </div>
                          <span className="ml-3 text-sm font-medium text-gray-700">
                            {config.appearance?.themeName === 'dark' ? 'Dark Mode' : 'Light Mode'}
                          </span>
                        </label>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-purple-600 mb-3">Theme Configuration</h3>
                      
                      {/* Colors section */}
                      <div className="mb-6">
                        <h4 className="text-md font-medium text-gray-700 mb-3">Colors</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {Object.entries(config.appearance?.theme || {}).filter(([key]) => 
                            key.includes('color') || key.includes('background') || 
                            !key.includes('rounded') && !key.includes('font') && !key.includes('weight')
                          ).map(([key, value]) => (
                            <div key={key} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                              <span className="text-sm text-gray-700 block mb-2 font-medium">{key}:</span>
                              <div className="relative">
                                <div
                                  className="w-full h-10 rounded-md border border-gray-300 cursor-pointer relative overflow-hidden"
                                  style={{ backgroundColor: typeof value === 'string' ? value : String(value) }}
                                  onClick={() => setActiveColorPicker(key)}
                                >
                                  <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent"></div>
                                </div>
                                {activeColorPicker === key && (
                                  <div className="absolute z-[1001] top-12 left-0">
                                    <div className="fixed inset-0" onClick={() => setActiveColorPicker(null)}></div>
                                    <div className="relative">
                                      <ChromePicker
                                        color={typeof value === 'string' ? value : '#000000'}
                                        onChangeComplete={(color: ColorResult) => {
                                          handleThemeChange(key as keyof ThemeVariables, color.hex);
                                        }}
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Border radius section */}
                      <div className="mb-6">
                        <h4 className="text-md font-medium text-gray-700 mb-3">Border Radius</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {Object.entries(config.appearance?.theme || {}).filter(([key]) => 
                            key.includes('rounded')
                          ).map(([key, value]) => (
                            <div key={key} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                              <span className="text-sm text-gray-700 block mb-2 font-medium">{key}:</span>
                              <div className="flex gap-2">
                                <select
                                  value={typeof value === 'string' ? value : String(value)}
                                  onChange={(e) => handleThemeChange(key as keyof ThemeVariables, e.target.value)}
                                  className="p-2 bg-white border border-gray-300 rounded-lg text-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                                >
                                  <option value="0">0</option>
                                  <option value="0.125rem">0.125rem</option>
                                  <option value="0.25rem">0.25rem</option>
                                  <option value="0.375rem">0.375rem</option>
                                  <option value="0.5rem">0.5rem</option>
                                  <option value="0.75rem">0.75rem</option>
                                  <option value="1rem">1rem</option>
                                  <option value="1.5rem">1.5rem</option>
                                  <option value="9999px">Full (9999px)</option>
                                </select>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Typography section */}
                      <div className="mb-6">
                        <h4 className="text-md font-medium text-gray-700 mb-3">Typography</h4>
                        <div className="grid grid-cols-1 gap-4">
                          {Object.entries(config.appearance?.theme || {}).filter(([key]) => 
                            key.includes('font') || key.includes('weight')
                          ).map(([key, value]) => (
                            <div key={key} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                              <span className="text-sm text-gray-700 block mb-2 font-medium">{key}:</span>
                              {key.includes('font-family') ? (
                                <input
                                  type="text"
                                  value={typeof value === 'string' ? value : String(value)}
                                  onChange={(e) => handleThemeChange(key as keyof ThemeVariables, e.target.value)}
                                  className="w-full p-2 bg-white border border-gray-300 rounded-lg text-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                                />
                              ) : (
                                <select
                                  value={typeof value === 'string' ? value : String(value)}
                                  onChange={(e) => handleThemeChange(key as keyof ThemeVariables, e.target.value)}
                                  className="w-full p-2 bg-white border border-gray-300 rounded-lg text-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                                >
                                  <option value="300">Light (300)</option>
                                  <option value="400">Regular (400)</option>
                                  <option value="500">Medium (500)</option>
                                  <option value="600">Semi-Bold (600)</option>
                                  <option value="700">Bold (700)</option>
                                </select>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </section>
                )}

                {/* Vendor Tab */}
                {activeTab === 'vendor' && (
                  <section className="space-y-6">
                    <h3 className="text-lg font-medium text-purple-600 mb-3">Brand Configuration</h3>
                    <div className="space-y-4">
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <label className="block mb-2 text-gray-700 font-medium">Vendor Name:</label>
                        <input
                          type="text"
                          value={config.vendor?.name || ''}
                          onChange={(e) => handleVendorChange('name', e.target.value)}
                          className="w-full p-3 bg-white border border-gray-300 rounded-lg text-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                          placeholder="Enter vendor name"
                        />
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <label className="block mb-2 text-gray-700 font-medium">Logo URL:</label>
                        <input
                          type="text"
                          value={config.vendor?.logo || ''}
                          onChange={(e) => handleVendorChange('logo', e.target.value)}
                          className="w-full p-3 bg-white border border-gray-300 rounded-lg text-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                          placeholder="Enter logo URL"
                        />
                      </div>
                      {config.vendor?.logo && (
                        <div className="mt-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                          <p className="text-gray-700 mb-2 font-medium">Logo Preview:</p>
                          <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-center">
                            <img 
                              src={config.vendor.logo} 
                              alt="Vendor Logo" 
                              className="max-h-20 max-w-full"
                              onError={(e) => (e.target as HTMLImageElement).src = 'data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22100%22%20height%3D%22100%22%20viewBox%3D%220%200%20100%20100%22%3E%3Crect%20fill%3D%22%23f0f0f0%22%20width%3D%22100%22%20height%3D%22100%22%2F%3E%3Ctext%20fill%3D%22%23888888%22%20font-family%3D%22sans-serif%22%20font-size%3D%2212%22%20x%3D%2250%25%22%20y%3D%2250%25%22%20text-anchor%3D%22middle%22%20dy%3D%22.3em%22%3EImage%20Not%20Found%3C%2Ftext%3E%3C%2Fsvg%3E'} 
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </section>
                )}

                {/* Login Options Tab */}
                {activeTab === 'login' && (
                  <section className="space-y-6">
                    <h3 className="text-lg font-medium text-purple-600 mb-3">Authentication Methods</h3>
                    
                    <div className="space-y-6">
                      {/* Social Logins */}
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <h4 className="text-gray-700 mb-3 font-medium">Social Logins:</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          {(['google', 'steam', 'twitter', 'apple'] as const).map((type) => (
                            <label key={type} className="flex items-center gap-3 bg-white p-3 rounded-lg border border-gray-200 hover:border-purple-500/50 transition-colors cursor-pointer">
                              <input
                                type="checkbox"
                                checked={config.loginOptions.socialLogins?.some(item => item.type === type)}
                                onChange={(e) => toggleLoginOption('socialLogins', type, e.target.checked)}
                                className="form-checkbox h-5 w-5 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                              />
                              <span className="text-gray-700">
                                {type.charAt(0).toUpperCase() + type.slice(1)}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* OTP Logins */}
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <h4 className="text-gray-700 mb-3 font-medium">OTP Logins:</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {(['email', 'phone'] as const).map((type) => (
                            <label key={type} className="flex items-center gap-3 bg-white p-3 rounded-lg border border-gray-200 hover:border-purple-500/50 transition-colors cursor-pointer">
                              <input
                                type="checkbox"
                                checked={config.loginOptions.otpLoginOptions?.some(item => item.type === type)}
                                onChange={(e) => toggleLoginOption('otpLoginOptions', type, e.target.checked)}
                                className="form-checkbox h-5 w-5 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                              />
                              <span className="text-gray-700">
                                {type.charAt(0).toUpperCase() + type.slice(1)}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* External Wallets */}
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <h4 className="text-gray-700 mb-3 font-medium">External Wallets:</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {(['metamask', 'walletconnect'] as const).map((type) => (
                            <label key={type} className="flex items-center gap-3 bg-white p-3 rounded-lg border border-gray-200 hover:border-purple-500/50 transition-colors cursor-pointer">
                              <input
                                type="checkbox"
                                checked={config.loginOptions.externalWallets?.some(item => item.type === type)}
                                onChange={(e) => toggleLoginOption('externalWallets', type, e.target.checked)}
                                className="form-checkbox h-5 w-5 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                              />
                              <span className="text-gray-700">
                                {type.charAt(0).toUpperCase() + type.slice(1)}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </section>
                )}
              </div>
              
              <div className="flex justify-end gap-4 p-4 border-t border-gray-200">
                <ButtonStyle
                  onClick={() => setIsOpen(false)}
                  variant="secondary"
                >
                  Cancel
                </ButtonStyle>
                <ButtonStyle
                  onClick={() => {
                    console.log('Current config:', themeConfig);
                    setIsOpen(false);
                    window.location.reload();
                  }}
                  variant="primary"
                >
                  Save Configuration
                </ButtonStyle>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OnboardingConfigurator;