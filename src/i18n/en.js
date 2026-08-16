/**
 * English language file
 */
export default {
  meta: {
    code: 'en',
    name: 'English',
    flag: '🇬🇧',
  },

  // — General —
  app: {
    title: 'CutOptimizer',
    subtitle: 'Linear Material Cutting Optimization',
    tagline: 'Minimize waste on profiles, pipes and other linear materials',
  },

  // — Navbar —
  nav: {
    newProject: 'New Project',
    openProject: 'Open Project',
    saveProject: 'Save',
    settings: 'Settings',
    language: 'Language',
    units: 'Units',
    theme: 'Theme',
    darkTheme: 'Dark Theme',
    lightTheme: 'Light Theme',
    login: 'Log In',
    signup: 'Sign Up',
    logout: 'Log Out',
    contact: 'Contact',
    premium: 'Premium',
  },

  // — Contact Form —
  contact: {
    title: 'Contact Us',
    subtitle: 'Send us your questions, feedback or inquiries.',
    name: 'Full Name',
    email: 'Email Address',
    subject: 'Subject',
    message: 'Your Message',
    send: 'Send Message',
    sending: 'Sending...',
    success: 'Your message has been sent successfully! Thank you.',
  },

  // — Authentication —
  auth: {
    title: 'User Account',
    subtitle: 'Save projects in the cloud and access from any device',
    mandatoryNotice: 'Please log in or register for free to use the calculator.',
    loginTab: 'Log In',
    signupTab: 'Sign Up',
    email: 'Email Address',
    password: 'Password',
    passwordConfirm: 'Confirm Password',
    forgotPasswordLink: 'Forgot password?',
    loginBtn: 'Log In',
    signupBtn: 'Sign Up Free',
    sendResetLink: 'Send Reset Link',
    forgotInstructions: 'Enter your account email. We will send you a password reset link.',
    backToLogin: 'Back to Log In',
  },

  // — Units —
  units: {
    metric: 'Metric (mm)',
    imperial: 'Imperial (inch)',
    mm: 'mm',
    cm: 'cm',
    m: 'm',
    inch: 'in',
    ft: 'ft',
  },

  // — Stock Materials —
  stock: {
    title: 'Stock Materials',
    addStock: 'Add Stock',
    length: 'Length',
    quantity: 'Quantity',
    quantityHint: '0 = unlimited',
    unitPrice: 'Bar Price',
    label: 'Label',
    labelPlaceholder: 'e.g. 6m IPE 200',
    removeStock: 'Remove',
    noStock: 'No stock materials added yet',
    unlimited: 'Unlimited',
    quickAdd: 'Quick add:',
  },

  // — Cut List —
  cuts: {
    title: 'Cut List',
    addCut: 'Add Cut',
    length: 'Length',
    quantity: 'Quantity',
    label: 'Label',
    labelPlaceholder: 'e.g. Column C1',
    removeCut: 'Remove',
    noCuts: 'No cut pieces added yet',
    totalTypes: '{count} types',
    totalPieces: '{count} pcs',
    pasteFromExcel: 'Paste from Excel',
    importCSV: 'Import CSV',
  },

  // — Parameters —
  params: {
    title: 'Optimization Parameters',
    kerfWidth: 'Kerf Width',
    kerfWidthHint: 'Blade thickness',
    minRemnant: 'Min. Usable Remnant',
    minRemnantHint: 'Pieces shorter than this are counted as waste',
    cutCost: 'Cost per Cut',
    cutCostHint: 'Additional cost per cut operation',
    algorithm: 'Algorithm',
    algorithmFFD: 'First Fit Decreasing (FFD)',
    algorithmBFD: 'Best Fit Decreasing (BFD)',
    algorithmBB: 'Branch & Bound (Optimal)',
    algorithmBBPremium: '🔒 Premium',
  },

  // — Action Buttons —
  actions: {
    optimize: '🚀 Optimize',
    optimizing: '⏳ Calculating...',
    reset: 'Reset',
    exportPdf: '📄 Download PDF',
    exportExcel: '📊 Download Excel',
  },

  // — Results —
  results: {
    title: 'Optimization Results',
    summary: 'Summary',
    totalStock: 'Stock Used',
    remainingStock: 'Remaining Stock',
    totalWaste: 'Total Waste',
    wastePercentage: 'Waste Ratio',
    totalCost: 'Total Cost',
    totalCuts: 'Total Cuts',
    materialCost: 'Material Cost',
    cuttingCost: 'Cutting Cost',
    usableRemnants: 'Usable Remnants',
    stockUsageBreakdown: 'Stock Usage & Remaining Stock',
    cuttingPlan: 'Cutting Plan',
    stockBar: 'Bar',
    pieces: 'pcs',
    waste: 'Waste',
    remnant: 'Remnant',
    noResults: 'No optimization performed yet',
    executionTime: 'Calculation Time',
    unplacedWarning: 'Warning: {count} cut pieces could not fit due to insufficient stock quantity!',
  },

  // — Visualizer —
  visualizer: {
    title: 'Cutting Diagram',
    zoomIn: 'Zoom In',
    zoomOut: 'Zoom Out',
    resetZoom: 'Reset',
    showLabels: 'Show Labels',
    hideLabels: 'Hide Labels',
  },

  // — Toasts —
  toast: {
    optimizeSuccess: 'Optimization completed!',
    optimizeError: 'An error occurred during optimization',
    saved: 'Project saved',
    exported: 'Export completed',
    noData: 'Please add at least one stock material and one cut piece',
    cutTooLong: 'Some cut pieces are longer than the available stock!',
    unplacedCuts: 'Warning: {count} cut pieces could not fit into the available stock!',
    invalidInput: 'Invalid input value',
    copied: 'Copied to clipboard',
    exportSuccess: 'File downloaded successfully',
    exportError: 'An error occurred during export',
  },

  // — Validation —
  validation: {
    required: 'This field is required',
    positive: 'Enter a positive number',
    integer: 'Enter a whole number',
    min: 'Minimum value: {min}',
    max: 'Maximum value: {max}',
  },

  // — Footer —
  footer: {
    copyright: '© {year} CutOptimizer — All rights reserved.',
    version: 'v{version}',
  },

  // — Common —
  common: {
    cancel: 'Cancel',
    confirm: 'Confirm',
    delete: 'Delete',
    edit: 'Edit',
    save: 'Save',
    close: 'Close',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    warning: 'Warning',
    info: 'Info',
    yes: 'Yes',
    no: 'No',
    or: 'or',
    and: 'and',
    currency: '$',
  },
};
