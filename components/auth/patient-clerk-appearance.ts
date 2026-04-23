/** Shared Clerk `<SignIn />` / `<SignUp />` styling for patient auth. */
export const patientClerkAppearance = {
  layout: { logoPlacement: 'none' as const, socialButtonsVariant: 'blockButton' as const },
  elements: {
    rootBox: 'w-full',
    card: 'shadow-none p-0 gap-0 bg-transparent',
    headerTitle: 'hidden',
    headerSubtitle: 'hidden',
    header: 'hidden',
    socialButtonsBlockButton:
      'border border-gray-200 rounded-xl h-11 font-medium text-sm text-gray-700 hover:bg-gray-50 transition mb-3',
    socialButtonsBlockButtonText: 'font-medium',
    dividerRow: 'my-4',
    dividerText: 'text-gray-400 text-xs',
    formFieldLabel: 'text-gray-700 text-sm font-medium',
    formFieldInput:
      'border border-gray-200 rounded-xl px-4 h-11 text-gray-900 text-sm focus:border-emerald-500 focus:ring-emerald-100 focus:ring-2 focus:outline-none',
    formButtonPrimary: 'bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl h-11 text-sm transition mt-1',
    footerActionLink: 'text-emerald-600 hover:text-emerald-700 font-medium',
    identityPreviewEditButtonIcon: 'hidden',
    otpCodeFieldInput:
      'border border-gray-200 rounded-xl text-gray-900 font-bold text-lg text-center focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 focus:outline-none',
    alertText: 'text-red-600 text-sm',
    formFieldInputShowPasswordButton: 'text-gray-400 hover:text-gray-600',
  },
}
