import { AppearanceOptions } from "@okto_web3/react-sdk";

export const STORAGE_KEY = 'okto_config'; 


export const defaultLightAppearanceOptions: AppearanceOptions = {
  version: "1.0.0",
  appearance: {
    themeName: "light",
    theme: {
      "--okto-body-background": "#ffffff", // background for whole page
      "--okto-body-color-tertiary": "#adb5bd", // placeholder text color
      "--okto-accent-color": "#5166ee", // accent color for buttons etc.
      "--okto-button-font-weight": "500",
      "--okto-border-color": "rgba(22, 22, 22, 0.12)", // border color for inputs
      "--okto-stroke-divider": "rgba(22, 22, 22, 0.06)", // divider color
      "--okto-font-family": "\"Inter\", sans-serif, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif",
      "--okto-rounded-sm": "0.25rem",
      "--okto-rounded-md": "0.5rem",
      "--okto-rounded-lg": "0.75rem",
      "--okto-rounded-xl": "1rem",
      "--okto-rounded-full": "9999px",
      "--okto-success-color": "#28a745", // success color for alerts
      "--okto-warning-color": "#ffc107", // warning color for alerts
      "--okto-error-color": "#f75757", // error color for alerts
      "--okto-text-primary": "#161616", // primary color for texts
      "--okto-text-secondary": "#707070", // secondary colors for texts (ex. subtitles)
      "--okto-background-surface": "#f8f8f8" // background color for card header in desktop view
    },
  },
  vendor: {
    name: "Okto wallet",
    logo: "/okto.svg",
  },
  loginOptions: {
    socialLogins: [
      { type: "google", position: 1 },
      { type: "steam", position: 2 },
      { type: "twitter", position: 3 }
    ],
    otpLoginOptions: [
      { type: "email", position: 1 },
      { type: "whatsapp", position: 2 },
    ],
    externalWallets: [
      {
        type: "metamask",
        position: 1,
        metadata: {
          iconUrl: "https://coindcx.s3.amazonaws.com/static/images/metamask.png",
          isInstalled: true
        }
      },
      {
        type: "walletconnect",
        position: 2,
        metadata: {
          iconUrl: "https://coindcx.s3.amazonaws.com/static/images/metamask.png",
          isInstalled: false
        }
      }
    ]
  }
};

export const defaultDarkAppearanceOptions: AppearanceOptions = {
  version: "1.0.0",
  appearance: {
    themeName: "dark",
    theme: {
      "--okto-body-background": "#121212", // dark background for whole page
      "--okto-body-color-tertiary": "#6c757d", // darker placeholder text color
      "--okto-accent-color": "#6c7aff", // brighter accent color for dark mode
      "--okto-button-font-weight": "500",
      "--okto-border-color": "rgba(255, 255, 255, 0.12)", // lighter border color for dark mode
      "--okto-stroke-divider": "rgba(255, 255, 255, 0.06)", // lighter divider color for dark mode
      "--okto-font-family": "\"Inter\", sans-serif, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif",
      "--okto-rounded-sm": "0.25rem",
      "--okto-rounded-md": "0.5rem",
      "--okto-rounded-lg": "0.75rem",
      "--okto-rounded-xl": "1rem",
      "--okto-rounded-full": "9999px",
      "--okto-success-color": "#2dd160", // brighter success color for dark mode
      "--okto-warning-color": "#ffcc33", // brighter warning color for dark mode
      "--okto-error-color": "#ff6b6b", // brighter error color for dark mode
      "--okto-text-primary": "#ffffff", // white text for dark mode
      "--okto-text-secondary": "#b0b0b0", // lighter secondary text for dark mode
      "--okto-background-surface": "#1e1e1e" // darker background color for card header in dark mode
    },
  },
  vendor: {
    name: "Okto wallet",
    logo: "/okto.svg",
  },
  loginOptions: {
    socialLogins: [
      { type: "google", position: 1 },
      { type: "steam", position: 2 },
      { type: "twitter", position: 3 }
    ],
    otpLoginOptions: [
      { type: "email", position: 1 },
      { type: "whatsapp", position: 2 },
    ],
    externalWallets: [
      {
        type: "metamask",
        position: 1,
        metadata: {
          iconUrl: "https://coindcx.s3.amazonaws.com/static/images/metamask.png",
          isInstalled: true
        }
      },
      {
        type: "walletconnect",
        position: 2,
        metadata: {
          iconUrl: "https://coindcx.s3.amazonaws.com/static/images/metamask.png",
          isInstalled: false
        }
      }
    ]
  }
};
