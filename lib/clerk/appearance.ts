import type { Appearance } from '@clerk/types';

/** Thème Clerk aligné sur Sojori — fond blanc opaque (évite modal transparente). */
export const clerkAppearance: Appearance = {
  variables: {
    colorPrimary: '#c89b3c',
    colorPrimaryForeground: '#faf7f0',
    colorText: '#0f1011',
    colorTextSecondary: '#6e6e73',
    colorBackground: '#ffffff',
    colorInputBackground: '#faf7f0',
    colorInputText: '#0f1011',
    colorNeutral: '#3a3a3c',
    colorDanger: '#e11d48',
    colorSuccess: '#059669',
    colorWarning: '#c89b3c',
    borderRadius: '0.75rem',
    fontFamily: 'Geist, system-ui, sans-serif',
    fontFamilyButtons: 'Geist, system-ui, sans-serif',
  },
  elements: {
    modalBackdrop: 'bg-[#0f1011]/60 backdrop-blur-sm',
    modalContent:
      '!bg-white !opacity-100 rounded-2xl border border-[#e9e3d3] shadow-2xl overflow-hidden',
    rootBox: '!bg-white',
    card: '!bg-white shadow-none border-0 rounded-none',
    cardBox: '!bg-white',
    header: '!bg-white',
    headerTitle:
      '!text-[#0f1011] font-[family-name:var(--font-serif)] text-[1.75rem] font-normal tracking-tight',
    headerSubtitle: '!text-[#6e6e73] text-sm',
    main: '!bg-white',
    footer: '!bg-[#faf7f0] border-t border-[#e9e3d3]',
    footerActionText: '!text-[#6e6e73]',
    formButtonPrimary:
      '!bg-[#0f1011] hover:!bg-[#1a1a1c] !text-[#faf7f0] font-semibold rounded-full normal-case text-sm',
    formFieldInput:
      '!bg-[#faf7f0] !text-[#0f1011] border-[#e9e3d3] rounded-lg focus:border-[#c89b3c]',
    formFieldLabel: '!text-[#3a3a3c] text-sm font-medium',
    footerActionLink: '!text-[#c89b3c] hover:!text-[#9b7626] font-medium',
    socialButtonsBlockButton:
      '!bg-white !text-[#0f1011] border-[#e9e3d3] hover:!bg-[#f3eee2] rounded-full text-sm font-medium',
    socialButtonsBlockButtonText: '!text-[#0f1011] font-medium',
    dividerLine: 'bg-[#e9e3d3]',
    dividerText: 'text-[#6e6e73] text-xs',
    identityPreviewEditButton: 'text-[#c89b3c]',
    navbarButton: 'text-[#6e6e73] hover:text-[#0f1011]',
    profileSectionPrimaryButton: 'text-[#c89b3c]',
    formFieldInputShowPasswordButton: 'text-[#6e6e73]',
    alertText: 'text-[#0f1011]',
  },
};
