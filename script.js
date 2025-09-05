// Global state management
let currentStep = 0; // Start with loan selection
let formData = {
    loanAmount: 1000000, // Default 10 lakhs
    interestRate: 8.5,
    tenure: 84
};
let uploadedDocuments = {};
let selectedEmploymentSubType = 'employed'; // Track employment type

// TJSB Consent Modal Functions
function handleTJSBConsentClick(event) {
    // Prevent the checkbox from being checked automatically
    event.preventDefault();
    showTJSBConsentModal();
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadSavedData();
    currentStep = 0; // Ensure we start with loan selection
    updateStepDisplay();
    setupEventListeners();
    setupAutoCalculations();
    setupTenureSlider();
    setApplicationDate();
    updateEmploymentSubTypeVisibility(); // Initialize employment sub-type visibility
    
    // Initialize document visibility after a brief delay to ensure DOM is ready
    setTimeout(() => {
        console.log('Initializing document visibility...');
        updateDocumentVisibility();
        
        // Force show income proof for individual users if hidden
        const employmentType = formData.employmentType || 'individual';
        if (employmentType === 'individual') {
            const incomeProofDoc = document.getElementById('incomeProofDoc');
            if (incomeProofDoc) {
                const parentItem = incomeProofDoc.closest('.upload-item');
                if (parentItem && parentItem.style.display === 'none') {
                    parentItem.style.display = 'block';
                    console.log('Force showed income proof document for individual user');
                }
            }
        }
    }, 100);
});

// Setup event listeners
function setupEventListeners() {
    // Selection button handlers
    const selectionButtons = document.querySelectorAll('.selection-btn');
    selectionButtons.forEach(button => {
        button.addEventListener('click', function() {
            const group = this.closest('.selection-group');
            const buttons = group.querySelectorAll('.selection-btn');
            buttons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');

            // Handle loan type selection to show/hide sub-type
            if (this.dataset.value === 'vehicle') {
                const subTypeSection = document.getElementById('loan-sub-type');
                if (subTypeSection) subTypeSection.style.display = 'block';
            } else if (this.closest('.selection-group').querySelector('[data-value="vehicle"]')) {
                const subTypeSection = document.getElementById('loan-sub-type');
                if (subTypeSection) subTypeSection.style.display = 'none';
            }

            // Handle customer category changes
            const groupLabel = group.querySelector('label').textContent.toLowerCase();
            if (groupLabel.includes('customer category')) {
                formData.employmentType = this.dataset.value;
                console.log('Customer category selected:', this.dataset.value);
                
                // Update form visibility immediately
                updateBasicFormVisibility();
                updatePersonalFormVisibility();
                updateIncomeFormVisibility();
                updateEmploymentSubTypeVisibility();
                updateDocumentVisibility();
            }

            // Track employment type changes (Employment Type section)
            if (groupLabel.includes('employment type') && !groupLabel.includes('sub')) {
                selectedEmploymentSubType = this.dataset.value;
                formData.employmentSubType = this.dataset.value;
                updateDocumentVisibility();
            }
        });
    });

    // Form input handlers for data persistence
    const formInputs = document.querySelectorAll('input, select, textarea');
    formInputs.forEach(input => {
        input.addEventListener('change', saveFormData);
        input.addEventListener('input', saveFormData);
    });

    // Verify button handlers for both individual and business forms
    const verifyBtns = document.querySelectorAll('.verify-btn');
    verifyBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const container = this.closest('.mobile-input-container');
            const mobileInput = container.querySelector('input[type="text"]');

            if (mobileInput.value && validateMobile(mobileInput.value)) {
                showOTPModal(mobileInput.value);
            } else {
                showError('Please enter a valid 10-digit mobile number');
            }
        });
    });

    // Existing customer dropdown handler
    const existingCustomerSelect = document.getElementById('existingCustomer');
    if (existingCustomerSelect) {
        existingCustomerSelect.addEventListener('change', function() {
            const cifField = document.getElementById('cifNumber');
            if (this.value === 'yes') {
                cifField.required = true;
                cifField.disabled = false;
                cifField.style.backgroundColor = '';
                cifField.placeholder = 'Enter your CIF number';
            } else if (this.value === 'no') {
                cifField.required = false;
                cifField.value = '';
                cifField.disabled = true;
                cifField.style.backgroundColor = '#f0f0f0';
                cifField.placeholder = 'Not applicable';
            } else {
                // If no option selected, reset to default
                cifField.required = false;
                cifField.disabled = false;
                cifField.style.backgroundColor = '';
                cifField.placeholder = 'Select existing customer first';
            }
        });
    }

    // Existing customer dropdown handler for company form
    const existingCustomerCompanySelect = document.getElementById('existingCustomerCompany');
    if (existingCustomerCompanySelect) {
        existingCustomerCompanySelect.addEventListener('change', function() {
            const cifField = document.getElementById('cifNumberCompany');
            if (this.value === 'yes') {
                cifField.required = true;
                cifField.disabled = false;
                cifField.style.backgroundColor = '';
                cifField.placeholder = 'Enter your CIF number';
            } else if (this.value === 'no') {
                cifField.required = false;
                cifField.value = '';
                cifField.disabled = true;
                cifField.style.backgroundColor = '#f0f0f0';
                cifField.placeholder = 'Not applicable';
            } else {
                // If no option selected, reset to default
                cifField.required = false;
                cifField.disabled = false;
                cifField.style.backgroundColor = '';
                cifField.placeholder = 'Select existing customer first';
            }
        });
    }
}

// Navigation functions
function nextStep() {
    if (validateCurrentStep()) {
        saveFormData();
        currentStep++;

        // Handle special navigation
        if (currentStep === 5) {
            // After step 4 (offer), go to document upload
            updateStepDisplay();
        } else if (currentStep === 6) {
            // After document upload, go to final approval
            updateStepDisplay();
        } else {
            updateStepDisplay();
            updateProgressStepper();
        }
    }
}

function prevStep() {
    if (currentStep > 0) {
        currentStep--;

        if (currentStep === 5) {
            // Going back to document upload
            updateStepDisplay();
        } else if (currentStep >= 1 && currentStep <= 4) {
            // Normal steps with progress stepper
            updateStepDisplay();
            updateProgressStepper();
        } else {
            // Loan selection page
            updateStepDisplay();
        }
    }
}

function startApplication() {
    saveSelectionData();
    currentStep = 1;
    
    // Add delay to ensure DOM is ready then update form visibility
    setTimeout(() => {
        updateBasicFormVisibility();
        updatePersonalFormVisibility();  
        updateIncomeFormVisibility();
        updateEmploymentSubTypeVisibility();
        updateDocumentVisibility();
    }, 100);
    
    updateStepDisplay();
    updateProgressStepper();
}

// Display management
function updateStepDisplay() {
    // Hide all step contents
    const stepContents = document.querySelectorAll('.step-content');
    stepContents.forEach(content => {
        content.style.display = 'none';
    });

    // Hide/show progress stepper based on current step
    const progressStepper = document.querySelector('.progress-stepper');
    if (progressStepper) {
        if (currentStep === 0 || currentStep >= 5) {
            progressStepper.style.display = 'none';
        } else {
            progressStepper.style.display = 'flex';
        }
    }

    // Show current step
    if (currentStep === 0) {
        // Loan selection page
        const loanSelection = document.getElementById('loan-selection');
        if (loanSelection) loanSelection.style.display = 'block';
    } else if (currentStep >= 1 && currentStep <= 4) {
        // Normal application steps
        const currentStepElement = document.getElementById(`step-${currentStep}`);
        if (currentStepElement) currentStepElement.style.display = 'block';
    } else if (currentStep === 5) {
        // Document upload page
        const documentUpload = document.getElementById('document-upload');
        if (documentUpload) documentUpload.style.display = 'block';
    } else if (currentStep === 6) {
        // Final approval page
        const finalApproval = document.getElementById('final-approval');
        if (finalApproval) finalApproval.style.display = 'block';
    } else if (currentStep === 7) {
        // Thank you page
        const thankYou = document.getElementById('thank-you');
        if (thankYou) thankYou.style.display = 'block';
    }

    // Update EMI calculation when showing offer
    if (currentStep === 4) {
        calculateEMI();
    }

    // Update form visibility when showing basic details step
    if (currentStep === 1) {
        updateBasicFormVisibility();
    }

    // Update form visibility when showing personal details step
    if (currentStep === 2) {
        updatePersonalFormVisibility();
    }

    // Update form visibility when showing income details step
    if (currentStep === 3) {
        updateIncomeFormVisibility();
    }
}

function updateProgressStepper() {
    const steps = document.querySelectorAll('.step[data-step]');
    steps.forEach(step => {
        const stepNumber = parseInt(step.dataset.step);
        step.classList.remove('active', 'completed');

        if (stepNumber === currentStep) {
            step.classList.add('active');
        } else if (stepNumber < currentStep) {
            step.classList.add('completed');
        }
    });
}

// Validation functions
function validateCurrentStep() {
    switch (currentStep) {
        case 0:
            return validateLoanSelection();
        case 1:
            return validateBasicDetails();
        case 2:
            return validatePersonalDetails();
        case 3:
            return validateIncomeDetails();
        case 4:
            return true; // Offer page
        case 5:
            return validateDocumentUpload();
        default:
            return true;
    }
}

function validateLoanSelection() {
    const loanTypeSelected = document.querySelector('.selection-btn.active[data-value]');
    if (!loanTypeSelected) {
        showError('Please select a loan type to continue');
        return false;
    }
    return true;
}

function validateDocumentUpload() {
    const employmentType = formData.employmentType || 'individual';
    let requiredDocs = ['bankStatement', 'dealerInvoice'];

    console.log('Validating documents for employment type:', employmentType);
    console.log('Selected employment sub type:', selectedEmploymentSubType);

    // Income proof is ALWAYS required for individual customers
    if (employmentType === 'individual') {
        requiredDocs.push('incomeProofDoc');
        console.log('Added incomeProofDoc to required documents for individual');
    }

    // GST is required for business-related employment sub-types
    if (selectedEmploymentSubType === 'self-business' ||
        selectedEmploymentSubType === 'llp-partnership' ||
        selectedEmploymentSubType === 'private-limited') {
        requiredDocs.push('gstDoc');
        console.log('Added gstDoc to required documents for business employment type');
    }

    console.log('Required documents:', requiredDocs);

    // Check each required document
    const documentStatus = {};
    requiredDocs.forEach(docId => {
        const doc = uploadedDocuments[docId];
        documentStatus[docId] = {
            exists: !!doc,
            verified: doc && doc.verified
        };
    });

    console.log('Document status:', documentStatus);

    const allUploaded = requiredDocs.every(docId => {
        const doc = uploadedDocuments[docId];
        return doc && doc.verified;
    });

    if (!allUploaded) {
        const missingDocs = requiredDocs.filter(docId => {
            const doc = uploadedDocuments[docId];
            return !doc || !doc.verified;
        });
        
        console.log('Missing documents:', missingDocs);
        showError(`Please verify all required documents. Missing: ${missingDocs.map(id => getDocumentDisplayName(id)).join(', ')}`);
        return false;
    }
    
    console.log('All required documents verified successfully');
    return true;
}

function validateBasicDetails() {
    clearFieldErrors();

    const employmentType = formData.employmentType || 'individual';

    if (employmentType === 'non-individual') {
        return validateNonIndividualBasicDetails();
    } else {
        return validateIndividualBasicDetails();
    }
}

function validateIndividualBasicDetails() {
    const fullName = document.getElementById('fullName').value.trim();
    const mobile = document.getElementById('mobile').value.trim();
    const loanAmount = document.getElementById('loanAmount').value.trim();
    const panNumber = document.getElementById('panNumber').value.trim();
    const agreeOVD = document.getElementById('agreeOVD').checked;

    let isValid = true;

    if (!fullName) {
        showFieldError('fullName', 'Please enter your full name');
        isValid = false;
    }

    if (!mobile || !validateMobile(mobile)) {
        showFieldError('mobile', 'Please enter a valid 10-digit mobile number');
        isValid = false;
    }

    if (!loanAmount || parseFloat(loanAmount) <= 0) {
        showFieldError('loanAmount', 'Please enter a valid loan amount');
        isValid = false;
    } else {
        formData.loanAmount = parseFloat(loanAmount);
    }

    if (!panNumber || !validatePAN(panNumber)) {
        showFieldError('panNumber', 'Please enter a valid PAN number (e.g., ABCDE1234F)');
        isValid = false;
    }

    if (!window.ovdVerified) {
        showError('Please verify your OVD details first');
        isValid = false;
    }

    if (!agreeOVD) {
        showError('Please agree to validate OVD details');
        isValid = false;
    }

    const agreeTerms = document.getElementById('agreeTerms').checked;
    if (!agreeTerms) {
        showError('Please agree to the Terms & Conditions and Privacy Policy');
        isValid = false;
    }

    const agreeConsent = document.getElementById('agreeConsent').checked;
    if (!agreeConsent) {
        showError('Please provide consent for communication');
        isValid = false;
    }

    return isValid;
}

function validateNonIndividualBasicDetails() {
    const fullName = document.getElementById('businessFullName').value.trim();
    const mobile = document.getElementById('businessMobile').value.trim();
    const loanAmount = document.getElementById('businessLoanAmount').value.trim();
    const panNumber = document.getElementById('businessPanNumber').value.trim();
    const agreeOVD = document.getElementById('businessAgreeOVD').checked;

    let isValid = true;

    if (!fullName) {
        showFieldError('businessFullName', 'Please enter your full name');
        isValid = false;
    }

    if (!mobile || !validateMobile(mobile)) {
        showFieldError('businessMobile', 'Please enter a valid 10-digit mobile number');
        isValid = false;
    }

    if (!loanAmount || parseFloat(loanAmount) <= 0) {
        showFieldError('businessLoanAmount', 'Please enter a valid loan amount');
        isValid = false;
    } else {
        formData.loanAmount = parseFloat(loanAmount);
    }

    if (!panNumber || !validatePAN(panNumber)) {
        showFieldError('businessPanNumber', 'Please enter a valid PAN number (e.g., ABCDE1234F)');
        isValid = false;
    }

    if (!window.ovdVerified) {
        showError('Please verify your OVD details first');
        isValid = false;
    }

    if (!agreeOVD) {
        showError('Please agree to validate OVD details');
        isValid = false;
    }

    const agreeTerms = document.getElementById('businessAgreeTerms').checked;
    if (!agreeTerms) {
        showError('Please agree to the Terms & Conditions and Privacy Policy');
        isValid = false;
    }

    const agreeConsent = document.getElementById('businessAgreeConsent').checked;
    if (!agreeConsent) {
        showError('Please provide consent for communication');
        isValid = false;
    }

    return isValid;
}

function validatePersonalDetails() {
    clearFieldErrors();

    const employmentType = formData.employmentType || 'individual';
    const employmentSubType = formData.employmentSubType || 'salaried';

    if (employmentType === 'non-individual' ||
        (employmentType === 'individual' &&
         (employmentSubType === 'llp-partnership' || employmentSubType === 'private-limited'))) {
        return validateNonIndividualPersonalDetails();
    } else {
        return validateIndividualPersonalDetails();
    }
}

function validateIndividualPersonalDetails() {
    const address1 = document.getElementById('address1').value.trim();
    const city = document.getElementById('city').value.trim();
    const state = document.getElementById('state').value;
    const pinCode = document.getElementById('pinCode').value.trim();
    const dob = document.getElementById('dob').value;
    const fatherName = document.getElementById('fatherName').value.trim();
    const aadharNumber = document.getElementById('aadharNumber').value.trim();
    const email = document.getElementById('email').value.trim();
    const gender = document.getElementById('gender').value;
    const existingCustomer = document.getElementById('existingCustomer').value;
    const cifNumber = document.getElementById('cifNumber').value.trim();
    const residenceType = document.getElementById('residenceType').value;
    const yearsAtResidence = document.getElementById('yearsAtResidence').value;

    let isValid = true;

    if (!address1) {
        showFieldError('address1', 'Please enter your address line 1');
        isValid = false;
    }

    if (!city) {
        showFieldError('city', 'Please enter your city');
        isValid = false;
    }

    if (!state) {
        showFieldError('state', 'Please select your state');
        isValid = false;
    }

    if (!pinCode || !validatePinCode(pinCode)) {
        showFieldError('pinCode', 'Please enter a valid 6-digit PIN code');
        isValid = false;
    }

    if (!dob) {
        showFieldError('dob', 'Please select your date of birth');
        isValid = false;
    }

    if (!fatherName) {
        showFieldError('fatherName', 'Please enter your father\'s name');
        isValid = false;
    }

    if (!aadharNumber || !validateAadhar(aadharNumber)) {
        showFieldError('aadharNumber', 'Please enter a valid 12-digit Aadhar number');
        isValid = false;
    }

    if (!email || !validateEmail(email)) {
        showFieldError('email', 'Please enter a valid email address');
        isValid = false;
    }

    if (!gender) {
        showFieldError('gender', 'Please select your gender');
        isValid = false;
    }

    if (!existingCustomer) {
        showFieldError('existingCustomer', 'Please specify if you are an existing customer');
        isValid = false;
    }

    if (existingCustomer === 'yes' && !cifNumber) {
        showFieldError('cifNumber', 'Please enter your CIF number');
        isValid = false;
    }

    if (!residenceType) {
        showFieldError('residenceType', 'Please select your residence type');
        isValid = false;
    }

    if (!yearsAtResidence || parseFloat(yearsAtResidence) < 0) {
        showFieldError('yearsAtResidence', 'Please enter valid years at current residence');
        isValid = false;
    }

    // Check TJSB Personal Consent
    const agreeTJSBPersonalConsent = document.getElementById('agreeTJSBPersonalConsent').checked;
    if (!agreeTJSBPersonalConsent || !window.tjsbPersonalConsentVerified) {
        showError('Please read and agree to the TJSB Bank information consent terms');
        isValid = false;
    }

    return isValid;
}

function validateNonIndividualPersonalDetails() {
    const companyName = document.getElementById('companyName').value.trim();
    const companyAddress1 = document.getElementById('companyAddress1').value.trim();
    const companyCity = document.getElementById('companyCity').value.trim();
    const companyState = document.getElementById('companyState').value;
    const companyPinCode = document.getElementById('companyPinCode').value.trim();
    const gstNumber = document.getElementById('gstNumber').value.trim();
    const panNumberCompany = document.getElementById('panNumberCompany').value.trim();
    const cinLlpNumber = document.getElementById('cinLlpNumber').value.trim();
    const existingCustomerCompany = document.getElementById('existingCustomerCompany').value;
    const cifNumberCompany = document.getElementById('cifNumberCompany').value.trim();

    let isValid = true;

    if (!companyName) {
        showFieldError('companyName', 'Please enter company name');
        isValid = false;
    }

    if (!companyAddress1) {
        showFieldError('companyAddress1', 'Please enter company address line 1');
        isValid = false;
    }

    if (!companyCity) {
        showFieldError('companyCity', 'Please enter city');
        isValid = false;
    }

    if (!companyState) {
        showFieldError('companyState', 'Please select state');
        isValid = false;
    }

    if (!companyPinCode || !validatePinCode(companyPinCode)) {
        showFieldError('companyPinCode', 'Please enter a valid 6-digit PIN code');
        isValid = false;
    }

    if (!gstNumber || !validateGSTNumber(gstNumber)) {
        showFieldError('gstNumber', 'Please enter a valid GST number');
        isValid = false;
    }

    if (!panNumberCompany || !validatePAN(panNumberCompany)) {
        showFieldError('panNumberCompany', 'Please enter a valid PAN number');
        isValid = false;
    }

    if (!cinLlpNumber) {
        showFieldError('cinLlpNumber', 'Please enter CIN/LLP number');
        isValid = false;
    }

    // Check if at least one director/partner is filled
    const directorName1 = document.getElementById('directorName1').value.trim();
    const directorDin1 = document.getElementById('directorDin1').value.trim();

    if (!directorName1 || !directorDin1) {
        showFieldError('directorName1', 'Please enter at least one director/partner name and DIN/LLP number');
        isValid = false;
    }

    if (!existingCustomerCompany) {
        showFieldError('existingCustomerCompany', 'Please specify if existing customer');
        isValid = false;
    }

    if (existingCustomerCompany === 'yes' && !cifNumberCompany) {
        showFieldError('cifNumberCompany', 'Please enter CIF number');
        isValid = false;
    }

    // Check TJSB Personal Consent for non-individual
    const agreeTJSBPersonalConsentCompany = document.getElementById('agreeTJSBPersonalConsentCompany').checked;
    if (!agreeTJSBPersonalConsentCompany || !window.tjsbPersonalConsentVerified) {
        showError('Please read and agree to the TJSB Bank information consent terms');
        isValid = false;
    }

    return isValid;
}

function validateIncomeDetails() {
    clearFieldErrors();

    const employmentType = formData.employmentType || 'individual';

    if (employmentType === 'non-individual') {
        return validateNonIndividualIncomeDetails();
    } else {
        return validateIndividualIncomeDetails();
    }
}

function validateIndividualIncomeDetails() {
    const employerName = document.getElementById('employerName').value.trim();
    const grossMonthlyIncome = document.getElementById('grossMonthlyIncome').value;
    const totalMonthlyObligation = document.getElementById('totalMonthlyObligation').value;
    const yearsAtEmployer = document.getElementById('yearsAtEmployer').value;
    const officialEmailID = document.getElementById('officialEmailID').value.trim();

    let isValid = true;

    if (!employerName) {
        showFieldError('employerName', 'Please enter your employer name');
        isValid = false;
    }

    if (!grossMonthlyIncome || parseFloat(grossMonthlyIncome) <= 0) {
        showFieldError('grossMonthlyIncome', 'Please enter a valid gross monthly income');
        isValid = false;
    }

    if (!totalMonthlyObligation || parseFloat(totalMonthlyObligation) < 0) {
        showFieldError('totalMonthlyObligation', 'Please enter valid total monthly obligation');
        isValid = false;
    }

    if (!yearsAtEmployer || parseFloat(yearsAtEmployer) < 0) {
        showFieldError('yearsAtEmployer', 'Please enter valid years at current employer');
        isValid = false;
    }

    if (!officialEmailID || !validateEmail(officialEmailID)) {
        showFieldError('officialEmailID', 'Please enter a valid official email address');
        isValid = false;
    }

    return isValid;
}

function validateNonIndividualIncomeDetails() {
    const gstAnnualTurnover = document.getElementById('gstAnnualTurnover').value;
    const grossAnnualIncome = document.getElementById('grossAnnualIncome').value;
    const otherAnnualIncome = document.getElementById('otherAnnualIncome').value;
    const currentEMI = document.getElementById('currentEMI').value;
    const yearsInBusiness = document.getElementById('yearsInBusiness').value;

    let isValid = true;

    if (!gstAnnualTurnover || parseFloat(gstAnnualTurnover) <= 0) {
        showFieldError('gstAnnualTurnover', 'Please enter valid GST annual turnover');
        isValid = false;
    }

    if (!grossAnnualIncome || parseFloat(grossAnnualIncome) <= 0) {
        showFieldError('grossAnnualIncome', 'Please enter a valid gross annual income');
        isValid = false;
    }

    if (!currentEMI || parseFloat(currentEMI) < 0) {
        showFieldError('currentEMI', 'Please enter valid current EMI');
        isValid = false;
    }

    if (!yearsInBusiness || parseFloat(yearsInBusiness) < 0) {
        showFieldError('yearsInBusiness', 'Please enter valid years in business');
        isValid = false;
    }

    return isValid;
}

function showFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    if (field) {
        field.parentElement.classList.add('error');

        // Remove existing error message
        const existingError = field.parentElement.querySelector('.field-error');
        if (existingError) existingError.remove();

        // Add new error message
        const errorElement = document.createElement('div');
        errorElement.className = 'field-error';
        errorElement.textContent = message;
        field.parentElement.appendChild(errorElement);
    }
}

function clearFieldErrors() {
    const errorFields = document.querySelectorAll('.form-group.error');
    errorFields.forEach(field => {
        field.classList.remove('error');
        const errorMessage = field.querySelector('.field-error');
        if (errorMessage) errorMessage.remove();
    });

    const errorMessages = document.querySelectorAll('.error-message');
    errorMessages.forEach(msg => msg.remove());
}


// Data persistence functions
function saveFormData() {
    const formInputs = document.querySelectorAll('input, select, textarea');
    formInputs.forEach(input => {
        if (input.type !== 'checkbox') {
            formData[input.id] = input.value;
        } else {
            formData[input.id] = input.checked;
        }
    });

    localStorage.setItem('loanApplicationData', JSON.stringify(formData));
}

function saveSelectionData() {
    const selections = {};
    const activeButtons = document.querySelectorAll('.selection-btn.active');
    activeButtons.forEach(button => {
        const group = button.closest('.selection-group');
        const label = group.querySelector('label').textContent.toLowerCase().replace(/\s+/g, '_');
        selections[label] = button.dataset.value;

        // Track customer category (Individual/Non-Individual)
        if (label.includes('customer_category')) {
            formData.employmentType = button.dataset.value;
            console.log('Saved customer category:', button.dataset.value);
        }

        // Track employment type (the sub-categories like employed, self-employed, etc.)
        if (label.includes('employment_type')) {
            selectedEmploymentSubType = button.dataset.value;
            formData.employmentSubType = button.dataset.value;
            console.log('Saved employment sub type:', button.dataset.value);
        }
    });

    formData.selections = selections;
    localStorage.setItem('loanApplicationData', JSON.stringify(formData));
}

function loadSavedData() {
    const savedData = localStorage.getItem('loanApplicationData');
    if (savedData) {
        formData = JSON.parse(savedData);

        // Restore form values
        Object.keys(formData).forEach(key => {
            const element = document.getElementById(key);
            if (element) {
                if (element.type !== 'checkbox') {
                    element.value = formData[key];
                } else {
                    element.checked = formData[key];
                }
            }
        });

        // Restore selections
        if (formData.selections) {
            Object.keys(formData.selections).forEach(groupKey => {
                const value = formData.selections[groupKey];
                const button = document.querySelector(`[data-value="${value}"]`);
                if (button) {
                    const group = button.closest('.selection-group');
                    const buttons = group.querySelectorAll('.selection-btn');
                    buttons.forEach(btn => btn.classList.remove('active'));
                    button.classList.add('active');

                    // Restore customer category
                    if (groupKey.includes('customer_category')) {
                        formData.employmentType = value;
                        console.log('Restored customer category:', value);
                    }

                    // Restore employment type
                    if (groupKey.includes('employment_type')) {
                        selectedEmploymentSubType = value;
                        formData.employmentSubType = value;
                        console.log('Restored employment type:', value);
                    }
                }
            });

            // Update all form visibilities after restoring selections
            updateBasicFormVisibility();
            updatePersonalFormVisibility();
            updateIncomeFormVisibility();
            updateEmploymentSubTypeVisibility();
            updateDocumentVisibility();
        }
    }
}

// Utility functions
function resetApplication() {
    localStorage.removeItem('loanApplicationData');
    formData = {
        loanAmount: 1000000,
        interestRate: 8.5,
        tenure: 84
    };
    uploadedDocuments = {};
    currentStep = 0; // Start with loan selection
    updateStepDisplay();

    // Reset forms
    const forms = document.querySelectorAll('form');
    forms.forEach(form => form.reset());

    // Reset selections
    const activeButtons = document.querySelectorAll('.selection-btn.active');
    activeButtons.forEach(button => {
        button.classList.remove('active');
    });

    // Reset upload boxes
    const uploadBoxes = document.querySelectorAll('.upload-box');
    uploadBoxes.forEach(box => {
        box.classList.remove('uploaded');
        const statusElement = box.querySelector('.upload-status');
        if (statusElement) statusElement.textContent = '';
        const button = box.querySelector('.upload-btn');
        if (button) {
            button.textContent = 'Verify';
            button.style.backgroundColor = '#ff9800';
        }
    });
}

function showLoanSelection() {
    currentStep = 0;
    updateStepDisplay();
}

function showDocumentUpload() {
    if (currentStep < 5) {
        currentStep = 5;
        updateStepDisplay();
    }
}

function showFinalApproval() {
    currentStep = 6;
    updateStepDisplay();
}

// New popup-based document verification system
function showDocumentVerificationPopup(documentType, documentId) {
    // Close any existing verification modals first
    closeAllVerificationModals();

    let popupContent = '';

    switch(documentType) {
        case 'bankStatement':
            popupContent = `
                <div class="verification-popup">
                    <h3>📊 Bank Statement Verification</h3>
                    <div class="upload-section">
                        <div class="upload-area" id="upload-area-${documentId}">
                            <div class="upload-icon">📄</div>
                            <p>Drag & Drop your PDF here or</p>
                            <button type="button" class="upload-file-btn" onclick="selectFile('${documentId}')">Choose File</button>
                        </div>
                        <div class="upload-status" id="upload-status-${documentId}"></div>
                    </div>
                    <form class="verification-form" id="form-${documentId}">
                        <div class="form-group">
                            <label>Account Number *</label>
                            <input type="password" id="accountNumber-${documentId}" required>
                        </div>
                        <div class="form-group">
                            <label>Bank Name *</label>
                            <input type="text" id="bankName-${documentId}" required>
                        </div>
                        <div class="form-group">
                            <label>IFSC Code *</label>
                            <input type="password" id="ifscCode-${documentId}" required>
                        </div>
                        <div class="form-group">
                            <label>Account Type *</label>
                            <select id="accountType-${documentId}" required>
                                <option value="">Select Account Type</option>
                                <option value="savings">Savings</option>
                                <option value="current">Current</option>
                                <option value="salary">Salary</option>
                            </select>
                        </div>
                        <div class="show-numbers-container">
                            <input type="checkbox" id="showBankNumbers-${documentId}" onchange="toggleBankNumbersVisibility('${documentId}')">
                            <label for="showBankNumbers-${documentId}">Show Numbers</label>
                        </div>
                    </form>
                </div>
            `;
            break;

        case 'gstDoc':
            popupContent = `
                <div class="verification-popup">
                    <h3>🏢 GST Certificate Verification</h3>
                    <div class="upload-section">
                        <div class="upload-area" id="upload-area-${documentId}">
                            <div class="upload-icon">📄</div>
                            <p>Drag & Drop your PDF here or</p>
                            <button type="button" class="upload-file-btn" onclick="selectFile('${documentId}')">Choose File</button>
                        </div>
                        <div class="upload-status" id="upload-status-${documentId}"></div>
                    </div>
                    <form class="verification-form" id="form-${documentId}">
                        <div class="form-group">
                            <label>GST Number *</label>
                            <input type="password" id="gstNumber-${documentId}" required placeholder="22AAAAA0000A1Z5">
                        </div>
                        <div class="form-group">
                            <label>Business Name *</label>
                            <input type="text" id="businessName-${documentId}" required>
                        </div>
                        <div class="form-group">
                            <label>Registration Date *</label>
                            <input type="date" id="registrationDate-${documentId}" required>
                        </div>
                        <div class="form-group">
                            <label>Business Type *</label>
                            <select id="businessType-${documentId}" required>
                                <option value="">Select Business Type</option>
                                <option value="proprietorship">Proprietorship</option>
                                <option value="partnership">Partnership</option>
                                <option value="private-limited">Private Limited</option>
                                <option value="public-limited">Public Limited</option>
                            </select>
                        </div>
                        <div class="show-numbers-container">
                            <input type="checkbox" id="showGstNumbers-${documentId}" onchange="toggleGstNumbersVisibility('${documentId}')">
                            <label for="showGstNumbers-${documentId}">Show Numbers</label>
                        </div>
                    </form>
                </div>
            `;
            break;

        case 'incomeProofDoc':
            // Check if this is for non-individual (business) users
            const employmentType = formData.employmentType || 'individual';
            const isNonIndividual = employmentType === 'non-individual';
            
            popupContent = `
                <div class="verification-popup">
                    <h3>📋 ${isNonIndividual ? 'Business Income Proof Verification' : 'Income Proof Document Verification'}</h3>
                    <div class="income-method-selection">
                        <h4>${isNonIndividual ? 'Choose business income verification method:' : 'Choose income proof method:'}</h4>
                        <div class="checkbox-options responsive-checkbox-grid">
                            ${!isNonIndividual ? `
                            <label class="checkbox-option">
                                <input type="radio" name="incomeMethod-${documentId}" value="salary-slip" onchange="toggleIncomeMethod('${documentId}', 'salary-slip')">
                                <span class="checkmark"></span>
                                <span class="option-text">Upload Salary Slip (3 months)</span>
                            </label>
                            ` : ''}
                            <label class="checkbox-option">
                                <input type="radio" name="incomeMethod-${documentId}" value="itr-upload" onchange="toggleIncomeMethod('${documentId}', 'itr-upload')">
                                <span class="checkmark"></span>
                                <span class="option-text">${isNonIndividual ? 'Upload Business ITR (3 years)' : 'Upload ITR (3 years)'}</span>
                            </label>
                            <label class="checkbox-option">
                                <input type="radio" name="incomeMethod-${documentId}" value="itr-fetch" onchange="toggleIncomeMethod('${documentId}', 'itr-fetch')">
                                <span class="checkmark"></span>
                                <span class="option-text">${isNonIndividual ? 'Fetch Business ITR from Portal' : 'Fetch ITR from Portal'}</span>
                            </label>
                            ${isNonIndividual ? `
                            <label class="checkbox-option">
                                <input type="radio" name="incomeMethod-${documentId}" value="financial-statements" onchange="toggleIncomeMethod('${documentId}', 'financial-statements')">
                                <span class="checkmark"></span>
                                <span class="option-text">Upload Financial Statements</span>
                            </label>
                            <label class="checkbox-option">
                                <input type="radio" name="incomeMethod-${documentId}" value="ca-certificate" onchange="toggleIncomeMethod('${documentId}', 'ca-certificate')">
                                <span class="checkmark"></span>
                                <span class="option-text">CA Certificate & Balance Sheet</span>
                            </label>
                            ` : ''}
                        </div>
                    </div>

                    <div class="income-fetch-section responsive-form-section" id="income-fetch-${documentId}" style="display: none;">
                        <h4>${isNonIndividual ? 'Business ITR Portal Login' : 'ITR Portal Login'}</h4>
                        <form class="verification-form responsive-form">
                            <div class="form-group">
                                <label>${isNonIndividual ? 'Business PAN/User ID *' : 'User ID *'}</label>
                                <input type="text" id="userId-${documentId}" required placeholder="${isNonIndividual ? 'Enter Business PAN or User ID' : 'Enter User ID'}">
                            </div>
                            <div class="form-group">
                                <label>Password *</label>
                                <input type="password" id="password-${documentId}" required placeholder="Enter portal password">
                            </div>
                            ${isNonIndividual ? `
                            <div class="form-group">
                                <label>Assessment Year *</label>
                                <select id="assessmentYear-${documentId}" required>
                                    <option value="">Select Assessment Year</option>
                                    <option value="2023-24">2023-24</option>
                                    <option value="2022-23">2022-23</option>
                                    <option value="2021-22">2021-22</option>
                                </select>
                            </div>
                            ` : ''}
                        </form>
                    </div>

                    <div class="income-upload-section responsive-form-section" id="income-upload-${documentId}" style="display: none;">
                        <div class="upload-section">
                            <div class="upload-area responsive-upload-area" id="upload-area-${documentId}">
                                <div class="upload-icon">📄</div>
                                <p class="upload-text">${isNonIndividual ? 'Upload Business Income Documents' : 'Drag & Drop your PDF here or'}</p>
                                <button type="button" class="upload-file-btn" onclick="selectFile('${documentId}')">Choose File</button>
                            </div>
                            <div class="upload-status" id="upload-status-${documentId}"></div>
                        </div>
                        <form class="verification-form responsive-form" id="income-details-form-${documentId}">
                            ${isNonIndividual ? `
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Annual Business Turnover (₹) *</label>
                                    <input type="number" id="businessTurnover-${documentId}" required placeholder="Enter annual turnover">
                                </div>
                                <div class="form-group">
                                    <label>Net Business Income (₹) *</label>
                                    <input type="number" id="netBusinessIncome-${documentId}" required placeholder="Enter net business income">
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Business Type *</label>
                                    <select id="businessType-${documentId}" required>
                                        <option value="">Select Business Type</option>
                                        <option value="manufacturing">Manufacturing</option>
                                        <option value="trading">Trading</option>
                                        <option value="services">Services</option>
                                        <option value="professional">Professional Services</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>Years in Business *</label>
                                    <input type="number" id="yearsInBusiness-${documentId}" required placeholder="Years in business" min="0">
                                </div>
                            </div>
                            ` : `
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Gross Annual Income (₹) *</label>
                                    <input type="number" id="grossIncome-${documentId}" required placeholder="Enter gross annual income">
                                </div>
                                <div class="form-group">
                                    <label>Net Annual Income (₹) *</label>
                                    <input type="number" id="netIncome-${documentId}" required placeholder="Enter net annual income">
                                </div>
                            </div>
                            `}
                        </form>
                    </div>

                    ${isNonIndividual ? `
                    <div class="financial-statements-section responsive-form-section" id="financial-statements-${documentId}" style="display: none;">
                        <h4>Financial Statements Upload</h4>
                        <div class="upload-section">
                            <div class="upload-area responsive-upload-area" id="upload-area-financial-${documentId}">
                                <div class="upload-icon">📊</div>
                                <p class="upload-text">Upload Profit & Loss Statement, Balance Sheet</p>
                                <button type="button" class="upload-file-btn" onclick="selectFile('financial-${documentId}')">Choose Files</button>
                            </div>
                        </div>
                        <form class="verification-form responsive-form">
                            <div class="form-group">
                                <label>Financial Year *</label>
                                <select id="financialYear-${documentId}" required>
                                    <option value="">Select Financial Year</option>
                                    <option value="2023-24">2023-24</option>
                                    <option value="2022-23">2022-23</option>
                                    <option value="2021-22">2021-22</option>
                                </select>
                            </div>
                        </form>
                    </div>

                    <div class="ca-certificate-section responsive-form-section" id="ca-certificate-${documentId}" style="display: none;">
                        <h4>CA Certificate & Balance Sheet</h4>
                        <div class="upload-section">
                            <div class="upload-area responsive-upload-area" id="upload-area-ca-${documentId}">
                                <div class="upload-icon">📋</div>
                                <p class="upload-text">Upload CA Certificate and Balance Sheet</p>
                                <button type="button" class="upload-file-btn" onclick="selectFile('ca-${documentId}')">Choose Files</button>
                            </div>
                        </div>
                        <form class="verification-form responsive-form">
                            <div class="form-row">
                                <div class="form-group">
                                    <label>CA Registration Number *</label>
                                    <input type="text" id="caRegNumber-${documentId}" required placeholder="Enter CA registration number">
                                </div>
                                <div class="form-group">
                                    <label>Certificate Date *</label>
                                    <input type="date" id="certificateDate-${documentId}" required>
                                </div>
                            </div>
                        </form>
                    </div>
                    ` : ''}
                </div>
            `;
            break;

        case 'dealerInvoice':
            popupContent = `
                <div class="verification-popup">
                    <h3>🚗 Dealer Invoice Verification</h3>
                    <div class="car-type-selection">
                        <h4>Select Car Type:</h4>
                        <div class="checkbox-options">
                            <label class="checkbox-option">
                                <input type="radio" name="carType-${documentId}" id="preOwned-${documentId}" value="preOwned" onchange="handleCarTypeSelection('${documentId}', 'preOwned')">
                                <span class="checkmark"></span>
                                Pre-owned
                            </label>
                            <label class="checkbox-option">
                                <input type="radio" name="carType-${documentId}" id="newCar-${documentId}" value="newCar" onchange="handleCarTypeSelection('${documentId}', 'newCar')">
                                <span class="checkmark"></span>
                                New Car
                            </label>
                        </div>
                    </div>

                    <div class="notification-message" id="preOwned-notification-${documentId}" style="display: none;">
                        <div class="info-box">
                            <span class="info-icon">ℹ️</span>
                            <p>For pre-owned cars, please contact your nearest branch for further assistance.</p>
                        </div>
                    </div>

                    <div class="fuel-type-section" id="fuelType-section-${documentId}" style="display: none;">
                        <h4>Select Fuel Type:</h4>
                        <div class="checkbox-options">
                            <label class="checkbox-option">
                                <input type="radio" name="fuelType-${documentId}" value="petrol-diesel" onchange="handleFuelTypeSelection('${documentId}', 'petrol-diesel')">
                                <span class="checkmark"></span>
                                Petrol/Diesel
                            </label>
                            <label class="checkbox-option">
                                <input type="radio" name="fuelType-${documentId}" value="ev" onchange="handleFuelTypeSelection('${documentId}', 'ev')">
                                <span class="checkmark"></span>
                                EV (Electric Vehicle)
                            </label>
                        </div>
                    </div>

                    <div class="document-upload-section" id="document-upload-${documentId}" style="display: none;">
                        <div class="upload-section">
                            <div class="upload-area" id="upload-area-${documentId}">
                                <div class="upload-icon">📄</div>
                                <p>Drag & Drop your PDF here or</p>
                                <button type="button" class="upload-file-btn" onclick="selectFile('${documentId}')">Choose File</button>
                            </div>
                            <div class="upload-status" id="upload-status-${documentId}"></div>
                        </div>
                        <form class="verification-form" id="form-${documentId}">
                            <div class="form-group">
                                <label>Dealer Address *</label>
                                <input type="text" id="dealerAddress-${documentId}" required>
                            </div>
                            <div class="form-group">
                                <label>Invoice Date *</label>
                                <input type="date" id="invoiceDate-${documentId}" required>
                            </div>
                            <div class="form-group">
                                <label>Ex-showroom Cost *</label>
                                <input type="number" id="exShowroomCost-${documentId}" required>
                            </div>
                            <div class="form-group">
                                <label>Registration *</label>
                                <input type="number" id="registration-${documentId}" required>
                            </div>
                            <div class="form-group">
                                <label>Insurance *</label>
                                <input type="number" id="insurance-${documentId}" required>
                            </div>
                            <div class="form-group">
                                <label>Discount *</label>
                                <input type="number" id="discount-${documentId}" required>
                            </div>
                            <div class="form-group">
                                <label>Exchange Amount *</label>
                                <input type="number" id="exchangeAmount-${documentId}" required>
                            </div>
                            <div class="form-group">
                                <label>Accessories & Others *</label>
                                <input type="number" id="accessories-${documentId}" required>
                            </div>
                            <div class="form-group">
                                <label>Other Taxes/GST & Others *</label>
                                <input type="number" id="otherTaxes-${documentId}" required>
                            </div>
                            <div class="form-group">
                                <label>Installation Fee *</label>
                                <input type="number" id="installationFee-${documentId}" required>
                            </div>
                            <div class="form-group">
                                <label>Total Invoice Value *</label>
                                <input type="number" id="totalInvoiceValue-${documentId}" required>
                            </div>
                        </form>
                    </div>
                </div>
            `;
            break;
    }

    const modal = document.createElement('div');
    modal.className = 'verification-modal';
    modal.id = `verification-modal-${documentId}`;
    
    modal.innerHTML = `
        <div class="verification-modal-content">
            <span class="close-verification" onclick="closeVerificationPopup('${documentId}')">&times;</span>
            ${popupContent}
            <div class="verification-actions">
                <button type="button" class="cancel-verification-btn" onclick="closeVerificationPopup('${documentId}')">Cancel</button>
                <button type="button" class="verify-document-btn" onclick="verifyDocument('${documentId}', '${documentType}')">Verify</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    modal.style.display = 'block';

    // Add drag and drop functionality
    setupDragAndDrop(documentId);
}

// Handler functions for dealer invoice
function handleCarTypeSelection(documentId, carType) {
    if (!documentId || !carType) {
        console.error('Invalid parameters for car type selection');
        return;
    }

    const preOwnedCheckbox = document.getElementById(`preOwned-${documentId}`);
    const newCarCheckbox = document.getElementById(`newCar-${documentId}`);
    const preOwnedNotification = document.getElementById(`preOwned-notification-${documentId}`);
    const fuelTypeSection = document.getElementById(`fuelType-section-${documentId}`);
    const documentUploadSection = document.getElementById(`document-upload-${documentId}`);

    // Add null checks
    if (!preOwnedCheckbox || !newCarCheckbox || !preOwnedNotification || !fuelTypeSection || !documentUploadSection) {
        console.error('Required elements not found for car type selection:', {
            preOwned: !!preOwnedCheckbox,
            newCar: !!newCarCheckbox,
            notification: !!preOwnedNotification,
            fuelSection: !!fuelTypeSection,
            uploadSection: !!documentUploadSection
        });
        return;
    }

    // Ensure only one checkbox is selected (radio button behavior)
    if (carType === 'preOwned') {
        preOwnedCheckbox.checked = true;
        newCarCheckbox.checked = false;
        preOwnedNotification.style.display = 'block';
        fuelTypeSection.style.display = 'none';
        documentUploadSection.style.display = 'none';

        // Clear fuel type selection when switching to pre-owned
        clearFuelTypeSelection(documentId);
    } else if (carType === 'newCar') {
        preOwnedCheckbox.checked = false;
        newCarCheckbox.checked = true;
        preOwnedNotification.style.display = 'none';
        fuelTypeSection.style.display = 'block';
        documentUploadSection.style.display = 'none';

        // Clear fuel type selection when switching to new car
        clearFuelTypeSelection(documentId);
    }
}

function handleFuelTypeSelection(documentId, fuelType) {
    if (!documentId || !fuelType) {
        console.error('Invalid parameters for fuel type selection');
        return;
    }

    const documentUploadSection = document.getElementById(`document-upload-${documentId}`);

    // Add null check
    if (!documentUploadSection) {
        console.error('Document upload section not found for ID:', documentId);
        return;
    }

    documentUploadSection.style.display = 'block';
}

function clearFuelTypeSelection(documentId) {
    const petrolDieselRadio = document.querySelector(`input[name="fuelType-${documentId}"][value="petrol-diesel"]`);
    const evRadio = document.querySelector(`input[name="fuelType-${documentId}"][value="ev"]`);

    if (petrolDieselRadio) petrolDieselRadio.checked = false;
    if (evRadio) evRadio.checked = false;
}

// Handler function for Income method selection
function toggleIncomeMethod(documentId, method) {
    if (!documentId || !method) {
        console.error('Invalid parameters for income method toggle');
        return;
    }

    const fetchSection = document.getElementById(`income-fetch-${documentId}`);
    const uploadSection = document.getElementById(`income-upload-${documentId}`);
    const financialSection = document.getElementById(`financial-statements-${documentId}`);
    const caSection = document.getElementById(`ca-certificate-${documentId}`);

    // Hide all sections first
    if (fetchSection) fetchSection.style.display = 'none';
    if (uploadSection) uploadSection.style.display = 'none';
    if (financialSection) financialSection.style.display = 'none';
    if (caSection) caSection.style.display = 'none';

    // Show appropriate section based on method
    switch(method) {
        case 'itr-fetch':
            if (fetchSection) fetchSection.style.display = 'block';
            break;
        case 'salary-slip':
        case 'itr-upload':
            if (uploadSection) uploadSection.style.display = 'block';
            break;
        case 'financial-statements':
            if (financialSection) financialSection.style.display = 'block';
            break;
        case 'ca-certificate':
            if (caSection) caSection.style.display = 'block';
            break;
        default:
            console.warn('Unknown income method:', method);
    }
}

// Handler function for ITR method selection (legacy)
function toggleITRMethod(documentId, method) {
    if (!documentId || !method) {
        console.error('Invalid parameters for ITR method toggle');
        return;
    }

    const fetchSection = document.getElementById(`itr-fetch-${documentId}`);
    const uploadSection = document.getElementById(`itr-upload-${documentId}`);

    // Add null checks
    if (!fetchSection || !uploadSection) {
        console.error('ITR method sections not found for ID:', documentId);
        return;
    }

    if (method === 'fetch') {
        fetchSection.style.display = 'block';
        uploadSection.style.display = 'none';
    } else if (method === 'upload') {
        fetchSection.style.display = 'none';
        uploadSection.style.display = 'block';
    }
}

function setupDragAndDrop(documentId) {
    if (!documentId) {
        console.error('Invalid document ID for drag and drop setup');
        return;
    }

    const uploadArea = document.getElementById(`upload-area-${documentId}`);

    if (!uploadArea) {
        console.error('Upload area not found for ID:', documentId);
        return;
    }

    uploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        this.classList.add('drag-over');
    });

    uploadArea.addEventListener('dragleave', function(e) {
        e.preventDefault();
        this.classList.remove('drag-over');
    });

    uploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        this.classList.remove('drag-over');

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileSelection(files[0], documentId);
        }
    });
}

function selectFile(documentId) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf';
    input.onchange = function(event) {
        const file = event.target.files[0];
        if (file) {
            handleFileSelection(file, documentId);
        }
    };
    input.click();
}

function handleFileSelection(file, documentId) {
    if (!file || !documentId) {
        console.error('Invalid file or document ID');
        return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        showError('File size should not exceed 5MB');
        return;
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
        showError('Please upload a PDF file only');
        return;
    }

    const uploadStatus = document.getElementById(`upload-status-${documentId}`);
    if (!uploadStatus) {
        console.error('Upload status element not found for ID:', documentId);
        return;
    }

    uploadStatus.innerHTML = `
        <div class="file-uploaded">
            <span class="file-icon">📄</span>
            <span class="file-name">${file.name}</span>
            <span class="file-size">(${(file.size / 1024 / 1024).toFixed(2)} MB)</span>
        </div>
    `;

    // Store file for later processing
    window.tempUploadedFiles = window.tempUploadedFiles || {};
    window.tempUploadedFiles[documentId] = file;
}

function verifyDocument(documentId, documentType) {
    // Special validation for dealer invoice
    if (documentType === 'dealerInvoice') {
        const preOwnedSelected = document.getElementById(`preOwned-${documentId}`)?.checked;
        const newCarSelected = document.getElementById(`newCar-${documentId}`)?.checked;

        if (!preOwnedSelected && !newCarSelected) {
            showError('Please select a car type (Pre-owned or New Car)');
            return;
        }

        if (preOwnedSelected) {
            // For pre-owned cars, just show notification - no further processing needed
            showSuccess('For pre-owned cars, please contact your nearest branch for further assistance.');
            closeVerificationPopup(documentId);
            return;
        }

        if (newCarSelected) {
            const petrolDieselSelected = document.querySelector(`input[name="fuelType-${documentId}"][value="petrol-diesel"]`)?.checked;
            const evSelected = document.querySelector(`input[name="fuelType-${documentId}"][value="ev"]`)?.checked;

            if (!petrolDieselSelected && !evSelected) {
                showError('Please select a fuel type');
                return;
            }

            // Check if PDF is uploaded and form is filled for new car
            const file = window.tempUploadedFiles && window.tempUploadedFiles[documentId];
            if (!file) {
                showError('Please upload a PDF file first');
                return;
            }

            const form = document.getElementById(`form-${documentId}`);
            if (form) {
                const requiredFields = form.querySelectorAll('[required]');
                let isValid = true;

                requiredFields.forEach(field => {
                    if (!field.value.trim()) {
                        field.style.borderColor = '#dc3545';
                        isValid = false;
                    } else {
                        field.style.borderColor = '#ddd';
                    }
                });

                if (!isValid) {
                    showError('Please fill all required fields');
                    return;
                }
            }
        }
    }

    // Special validation for Income Proof Document
    if (documentType === 'incomeProofDoc') {
        const salarySlipSelected = document.querySelector(`input[name="incomeMethod-${documentId}"][value="salary-slip"]`)?.checked;
        const itrUploadSelected = document.querySelector(`input[name="incomeMethod-${documentId}"][value="itr-upload"]`)?.checked;
        const itrFetchSelected = document.querySelector(`input[name="incomeMethod-${documentId}"][value="itr-fetch"]`)?.checked;

        if (!salarySlipSelected && !itrUploadSelected && !itrFetchSelected) {
            showError('Please select an income proof method');
            return;
        }

        if (itrFetchSelected) {
            const userId = document.getElementById(`userId-${documentId}`)?.value;
            const password = document.getElementById(`password-${documentId}`)?.value;

            if (!userId || !password) {
                showError('Please provide User ID and Password for fetching ITR data');
                return;
            }
        }

        if (salarySlipSelected || itrUploadSelected) {
            const file = window.tempUploadedFiles && window.tempUploadedFiles[documentId];
            if (!file) {
                showError('Please upload the required document');
                return;
            }

            const grossIncome = document.getElementById(`grossIncome-${documentId}`)?.value;
            const netIncome = document.getElementById(`netIncome-${documentId}`)?.value;

            if (!grossIncome || !netIncome) {
                showError('Please fill gross income and net income');
                return;
            }
        }
    }

    // Legacy ITR validation
    if (documentType === 'itrDoc') {
        const fetchSelected = document.querySelector(`input[name="itrMethod-${documentId}"][value="fetch"]`)?.checked;
        const uploadSelected = document.querySelector(`input[name="itrMethod-${documentId}"][value="upload"]`)?.checked;

        if (!fetchSelected && !uploadSelected) {
            showError('Please select a verification method');
            return;
        }

        if (fetchSelected) {
            const userId = document.getElementById(`userId-${documentId}`)?.value;
            const password = document.getElementById(`password-${documentId}`)?.value;

            if (!userId || !password) {
                showError('Please provide User ID and Password for fetching ITR data');
                return;
            }
        }

        if (uploadSelected) {
            const file = window.tempUploadedFiles && window.tempUploadedFiles[documentId];
            if (!file) {
                showError('Please upload a PDF file first');
                return;
            }

            const grossIncome = document.getElementById(`grossIncome-${documentId}`)?.value;
            const netIncome = document.getElementById(`netIncome-${documentId}`)?.value;

            if (!grossIncome || !netIncome) {
                showError('Please fill gross income and net income');
                return;
            }
        }
    }

    // Validation for bank statement
    if (documentType === 'bankStatement') {
        const file = window.tempUploadedFiles && window.tempUploadedFiles[documentId];
        if (!file) {
            showError('Please upload a PDF file first');
            return;
        }

        const form = document.getElementById(`form-${documentId}`);
        if (form) {
            const requiredFields = form.querySelectorAll('[required]');
            let isValid = true;

            requiredFields.forEach(field => {
                if (!field.value.trim()) {
                    field.style.borderColor = '#dc3545';
                    isValid = false;
                } else {
                    field.style.borderColor = '#ddd';
                }
            });

            if (!isValid) {
                showError('Please fill all required fields');
                return;
            }
        }
    }

    // Validation for GST document
    if (documentType === 'gstDoc') {
        const file = window.tempUploadedFiles && window.tempUploadedFiles[documentId];
        if (!file) {
            showError('Please upload a PDF file first');
            return;
        }

        const form = document.getElementById(`form-${documentId}`);
        if (form) {
            const requiredFields = form.querySelectorAll('[required]');
            let isValid = true;

            requiredFields.forEach(field => {
                if (!field.value.trim()) {
                    field.style.borderColor = '#dc3545';
                    isValid = false;
                } else {
                    field.style.borderColor = '#ddd';
                }
            });

            if (!isValid) {
                showError('Please fill all required fields');
                return;
            }
        }
    }

    // Show loading
    showLoading();

    // Simulate verification process
    setTimeout(() => {
        hideLoading();

        // Generate verification ID
        const verificationId = generateVerificationId(documentType);

        // Get file reference
        const file = window.tempUploadedFiles && window.tempUploadedFiles[documentId];

        // For ITR fetch method, create a dummy file object
        let fileData = file;
        if (documentType === 'itrDoc') {
            const fetchSelected = document.querySelector(`input[name="itrMethod-${documentId}"][value="fetch"]`)?.checked;
            if (fetchSelected && !file) {
                fileData = {
                    name: 'ITR_Fetched_Data.pdf',
                    size: 1024,
                    type: 'application/pdf'
                };
            }
        }

        // Store document data
        let fileURL = null;
        if (fileData && fileData instanceof File) {
            try {
                fileURL = URL.createObjectURL(fileData);
            } catch (error) {
                console.error('Error creating object URL:', error);
                fileURL = null;
            }
        }

        uploadedDocuments[documentId] = {
            name: fileData ? fileData.name : 'Document.pdf',
            size: fileData ? fileData.size : 1024,
            type: fileData ? fileData.type : 'application/pdf',
            uploadDate: new Date(),
            fileURL: fileURL,
            file: fileData,
            verified: true,
            verificationId: verificationId,
            documentType: documentType
        };

        // Update UI
        updateDocumentStatus(documentId, documentType, verificationId);

        // Close popup
        closeVerificationPopup(documentId);

        // Check if all documents are uploaded
        checkAllDocumentsUploaded();

        showSuccess(`${getDocumentDisplayName(documentType)} verified successfully! ID: ${verificationId}`);
    }, 2000);
}

function generateVerificationId(documentType) {
    const prefix = {
        'bankStatement': 'BS',
        'gstDoc': 'GST',
        'itrDoc': 'ITR',
        'dealerInvoice': 'DI'
    };

    const randomNumber = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    return `${prefix[documentType]}${randomNumber}`;
}

function getDocumentDisplayName(documentType) {
    const names = {
        'bankStatement': 'Bank Statement',
        'gstDoc': 'GST Certificate',
        'itrDoc': 'ITR Document',
        'incomeProofDoc': 'Income Proof Document',
        'dealerInvoice': 'Dealer Invoice'
    };
    return names[documentType] || 'Document';
}

function updateDocumentStatus(documentId, documentType, verificationId) {
    const uploadBox = document.getElementById(documentId);
    uploadBox.classList.add('uploaded');

    const uploadBtn = uploadBox.querySelector('.upload-btn');
    uploadBtn.textContent = '✓ Verified';
    uploadBtn.style.background = 'linear-gradient(135deg, #28a745, #20c997)';
    uploadBtn.style.color = 'white';
    uploadBtn.style.border = 'none';
    uploadBtn.style.boxShadow = '0 4px 12px rgba(40, 167, 69, 0.3)';
    uploadBtn.disabled = true;

    const statusElement = uploadBox.querySelector('.upload-status');
    statusElement.innerHTML = `
        <div class="verification-success">
            <div class="success-info">
                <span class="success-check">✅</span>
                <span class="verification-id">ID: ${verificationId}</span>
            </div>
            <div class="document-actions">
                <button class="view-document-btn" onclick="viewUploadedDocument('${documentId}')">
                    👁️ View
                </button>
            </div>
        </div>
    `;
}

function viewUploadedDocument(documentId) {
    const document = uploadedDocuments[documentId];
    if (!document || !document.fileURL) {
        showError('Document not found');
        return;
    }

    showDocumentPreview(documentId);
}

function closeVerificationPopup(documentId) {
    const modal = document.getElementById(`verification-modal-${documentId}`);
    if (modal) {
        modal.remove();
    }

    // Clean up temp files
    if (window.tempUploadedFiles && window.tempUploadedFiles[documentId]) {
        delete window.tempUploadedFiles[documentId];
    }
}

function closeAllVerificationModals() {
    // Close all verification modals
    const existingModals = document.querySelectorAll('.verification-modal');
    existingModals.forEach(modal => modal.remove());

    // Clean up all temp files
    if (window.tempUploadedFiles) {
        window.tempUploadedFiles = {};
    }
}

function processFileUpload(file, documentId, uploadType, buttonElement) {
    showLoading();

    // Create file URL for preview
    let fileURL = null;
    try {
        if (file instanceof File) {
            fileURL = URL.createObjectURL(file);
        }
    } catch (error) {
        console.error('Error creating object URL:', error);
        fileURL = null;
    }

    // Simulate upload process
    setTimeout(() => {
        hideLoading();

        // Mark as uploaded with file URL for preview
        uploadedDocuments[documentId] = {
            name: file.name,
            size: file.size,
            type: file.type,
            uploadDate: new Date(),
            fileURL: fileURL,
            file: file
        };

        // Update UI
        const uploadBox = document.getElementById(documentId);
        uploadBox.classList.add('uploaded');

        const statusElement = uploadBox.querySelector('.upload-status');
        statusElement.innerHTML = `
            <div class="upload-success">
                <span class="success-check">✓</span>
                <span class="file-name">${file.name}</span>
                <button class="preview-btn" onclick="showDocumentPreview('${documentId}')">
                    👁️ Preview
                </button>
            </div>
        `;

        // Add verification buttons for different documents
        if (documentId === 'bankStatement') {
            statusElement.innerHTML += `
                <button class="verify-bank-btn" onclick="showBankVerificationModal()">
                    Verify Bank Account
                </button>
            `;
        } else if (documentId === 'dealerInvoice') {
            statusElement.innerHTML += `
                <button class="verify-dealer-btn" onclick="showDealerVerificationModal()">
                    Verify Dealer Invoice
                </button>
            `;
        } else if (documentId === 'gstDoc') {
            statusElement.innerHTML += `
                <button class="verify-gst-btn" onclick="showGSTVerificationModal()">
                    Verify GST
                </button>
            `;
        } else if (documentId === 'itrDoc') {
            statusElement.innerHTML += `
                <button class="verify-itr-btn" onclick="showITRVerificationModal()">
                    Verify ITR
                </button>
            `;
        }

        if (buttonElement) {
            buttonElement.textContent = 'Re-upload';
            buttonElement.style.backgroundColor = '#28a745';
        }

        // Check if all documents are uploaded
        checkAllDocumentsUploaded();

        showSuccess(`${uploadType} uploaded successfully!`);
    }, 1500);
}

function checkAllDocumentsUploaded() {
    const employmentType = formData.employmentType || 'individual';
    let requiredDocs = ['bankStatement', 'dealerInvoice'];

    console.log('Checking documents for employment type:', employmentType);

    // Income proof is ALWAYS required for individual customers
    if (employmentType === 'individual') {
        requiredDocs.push('incomeProofDoc');
        console.log('Income proof document required for individual');
    }

    // GST is required for business-related employment sub-types
    if (selectedEmploymentSubType === 'self-business' ||
        selectedEmploymentSubType === 'llp-partnership' ||
        selectedEmploymentSubType === 'private-limited') {
        requiredDocs.push('gstDoc');
        console.log('GST document required for business employment type');
    }

    console.log('Required documents list:', requiredDocs);

    // Check verification status for each required document
    const verificationStatus = requiredDocs.map(docId => {
        const doc = uploadedDocuments[docId];
        const verified = doc && doc.verified;
        console.log(`Document ${docId}: ${verified ? 'VERIFIED' : 'NOT VERIFIED'}`);
        return verified;
    });

    const allVerified = verificationStatus.every(status => status);
    const verifiedCount = verificationStatus.filter(status => status).length;
    const totalRequired = requiredDocs.length;

    console.log(`Documents verified: ${verifiedCount}/${totalRequired}`);

    const proceedButton = document.getElementById('proceedToApproval');
    if (proceedButton) {
        if (allVerified) {
            proceedButton.style.backgroundColor = '#28a745';
            proceedButton.textContent = 'All Documents Verified - Proceed';
            proceedButton.disabled = false;
            console.log('All documents verified - proceed button enabled');
        } else {
            const missingCount = totalRequired - verifiedCount;
            proceedButton.style.backgroundColor = '#f44336';
            proceedButton.textContent = `Verify ${missingCount} more document${missingCount > 1 ? 's' : ''}`;
            proceedButton.disabled = true;
            console.log(`${missingCount} documents still need verification`);
        }
    }
}

// Setup upload handlers - DISABLED to avoid conflict with onclick handlers
function setupUploadHandlers() {
    // Commenting out to avoid conflict with HTML onclick handlers
    // const uploadButtons = document.querySelectorAll('.upload-btn');
    // uploadButtons.forEach(button => {
    //     button.addEventListener('click', function() {
    //         const uploadBox = this.closest('.upload-box');
    //         const uploadType = uploadBox.querySelector('h3').textContent;
    //         const documentId = uploadBox.id;
    //         handleDocumentUpload(documentId); // Changed to call handleDocumentUpload
    //     });
    // });
    console.log('setupUploadHandlers disabled to prevent conflicts with onclick handlers');
}

// Update income form visibility based on employment type
function updateIncomeFormVisibility() {
    const individualForm = document.getElementById('individual-income-form');
    const nonIndividualForm = document.getElementById('non-individual-income-form');

    if (!individualForm || !nonIndividualForm) {
        console.warn('Income form elements not found');
        return;
    }

    const employmentType = formData.employmentType || 'individual';
    console.log('Updating income form visibility for:', employmentType);

    if (employmentType === 'non-individual') {
        individualForm.style.display = 'none';
        nonIndividualForm.style.display = 'block';

        // Clear required attributes from individual form
        const individualInputs = individualForm.querySelectorAll('input[required], select[required]');
        individualInputs.forEach(input => input.removeAttribute('required'));

        // Add required attributes to non-individual form
        const nonIndividualInputs = nonIndividualForm.querySelectorAll('input, select');
        nonIndividualInputs.forEach(input => {
            if (input.id !== 'otherAnnualIncome' && input.type !== 'readonly' && !input.disabled) {
                input.setAttribute('required', 'required');
            }
        });
    } else {
        individualForm.style.display = 'block';
        nonIndividualForm.style.display = 'none';

        // Add required attributes to individual form
        const individualInputs = individualForm.querySelectorAll('input, select');
        individualInputs.forEach(input => {
            if (input.type !== 'readonly' && input.id !== 'bonusOvertimeArrear' && !input.disabled) {
                input.setAttribute('required', 'required');
            }
        });

        // Clear required attributes from non-individual form
        const nonIndividualInputs = nonIndividualForm.querySelectorAll('input[required], select[required]');
        nonIndividualInputs.forEach(input => input.removeAttribute('required'));
    }
}

// Update basic form visibility based on employment type
function updateBasicFormVisibility() {
    const individualForm = document.getElementById('individual-basic-form');
    const nonIndividualForm = document.getElementById('non-individual-basic-form');

    if (!individualForm || !nonIndividualForm) {
        console.warn('Basic form elements not found');
        return;
    }

    const employmentType = formData.employmentType || 'individual';
    console.log('Updating basic form visibility for:', employmentType);

    if (employmentType === 'non-individual') {
        individualForm.style.display = 'none';
        nonIndividualForm.style.display = 'block';

        // Clear required attributes from individual form
        const individualInputs = individualForm.querySelectorAll('input[required], select[required]');
        individualInputs.forEach(input => input.removeAttribute('required'));

        // Add required attributes to non-individual form
        const nonIndividualInputs = nonIndividualForm.querySelectorAll('input, select');
        nonIndividualInputs.forEach(input => {
            if (!input.disabled) {
                input.setAttribute('required', 'required');
            }
        });
    } else {
        individualForm.style.display = 'block';
        nonIndividualForm.style.display = 'none';

        // Add required attributes to individual form
        const individualInputs = individualForm.querySelectorAll('input, select');
        individualInputs.forEach(input => {
            if (!input.disabled) {
                input.setAttribute('required', 'required');
            }
        });

        // Clear required attributes from non-individual form
        const nonIndividualInputs = nonIndividualForm.querySelectorAll('input[required], select[required]');
        nonIndividualInputs.forEach(input => input.removeAttribute('required'));
    }
}

// Update personal form visibility based on employment type
function updatePersonalFormVisibility() {
    const individualForm = document.querySelector('#step-2 .form-container:not(#non-individual-personal-form)');
    const nonIndividualForm = document.getElementById('non-individual-personal-form');

    if (!individualForm || !nonIndividualForm) {
        console.warn('Personal form elements not found');
        return;
    }

    const employmentType = formData.employmentType || 'individual';
    console.log('Updating personal form visibility for:', employmentType);

    if (employmentType === 'non-individual') {
        individualForm.style.display = 'none';
        nonIndividualForm.style.display = 'block';

        // Clear required attributes from individual form
        const individualInputs = individualForm.querySelectorAll('input[required], select[required], textarea[required]');
        individualInputs.forEach(input => input.removeAttribute('required'));

        // Add required attributes to non-individual form
        const nonIndividualInputs = nonIndividualForm.querySelectorAll('input, select, textarea');
        nonIndividualInputs.forEach(input => {
            if (input.id !== 'cifNumberCompany' && input.id !== 'bureauScoreCompany' && input.id !== 'companyAddress2' && 
                !input.id.includes('director') || (input.id === 'directorName1' || input.id === 'directorDin1')) {
                input.setAttribute('required', 'required');
            }
        });

        // Make sure TJSB consent checkbox is required for non-individual
        const tjsbConsentCheckbox = document.getElementById('agreeTJSBPersonalConsentCompany');
        if (tjsbConsentCheckbox) {
            tjsbConsentCheckbox.setAttribute('required', 'required');
        }
    } else {
        individualForm.style.display = 'block';
        nonIndividualForm.style.display = 'none';

        // Add required attributes to individual form
        const individualInputs = individualForm.querySelectorAll('input, select, textarea');
        individualInputs.forEach(input => {
            if (input.id !== 'cifNumber' && input.id !== 'bureauScore' && input.id !== 'address2') {
                input.setAttribute('required', 'required');
            }
        });

        // Clear required attributes from non-individual form
        const nonIndividualInputs = nonIndividualForm.querySelectorAll('input[required], select[required], textarea[required]');
        nonIndividualInputs.forEach(input => input.removeAttribute('required'));
    }
}

// Update employment sub-type visibility based on employment type
function updateEmploymentSubTypeVisibility() {
    const employmentType = formData.employmentType || 'individual';
    const employmentSubTypeButtons = document.querySelectorAll('.employment-sub-type-btn');

    employmentSubTypeButtons.forEach(button => {
        const buttonValue = button.dataset.value;

        if (employmentType === 'non-individual') {
            // For non-individual, only show LLP/Partnership and Private Limited
            if (buttonValue === 'llp-partnership' || buttonValue === 'private-limited') {
                button.style.display = 'block';
            } else {
                button.style.display = 'none';
                // Remove active class if hidden button was active
                if (button.classList.contains('active')) {
                    button.classList.remove('active');
                }
            }
        } else {
            // For individual, show all except LLP/Partnership and Private Limited
            if (buttonValue === 'llp-partnership' || buttonValue === 'private-limited') {
                button.style.display = 'none';
                // Remove active class if hidden button was active
                if (button.classList.contains('active')) {
                    button.classList.remove('active');
                }
            } else {
                button.style.display = 'block';
            }
        }
    });

    // If no employment sub-type is selected after filtering, select the first visible one
    const activeSubType = document.querySelector('.employment-sub-type-btn.active[style*="block"], .employment-sub-type-btn.active:not([style*="none"])');
    if (!activeSubType) {
        const firstVisible = document.querySelector('.employment-sub-type-btn[style*="block"], .employment-sub-type-btn:not([style*="none"])');
        if (firstVisible) {
            firstVisible.classList.add('active');
            selectedEmploymentSubType = firstVisible.dataset.value;
            formData.employmentSubType = firstVisible.dataset.value;
        }
    }

    updateDocumentVisibility();
}

// Update document visibility based on employment sub-type
function updateDocumentVisibility() {
    const employmentType = formData.employmentType || 'individual';
    const gstDocument = document.getElementById('gstDocument');
    
    // Find income proof document more reliably
    let incomeProofDocument = document.getElementById('incomeProofDoc')?.closest('.upload-item');
    if (!incomeProofDocument) {
        // Alternative search method
        const uploadItems = document.querySelectorAll('.upload-item');
        uploadItems.forEach(item => {
            const uploadBox = item.querySelector('#incomeProofDoc');
            if (uploadBox) {
                incomeProofDocument = item;
            }
        });
    }

    console.log('Employment Type:', employmentType);
    console.log('Selected Employment Sub Type:', selectedEmploymentSubType);
    console.log('Income Proof Document Found:', !!incomeProofDocument);

    // Show GST document for business-related employment sub-types
    if (selectedEmploymentSubType === 'self-business' ||
        selectedEmploymentSubType === 'llp-partnership' ||
        selectedEmploymentSubType === 'private-limited') {
        if (gstDocument) {
            gstDocument.style.display = 'block';
            console.log('GST Document: SHOWN (business employment type)');
        }
    } else {
        if (gstDocument) {
            gstDocument.style.display = 'none';
            console.log('GST Document: HIDDEN (non-business employment type)');
        }
    }

    // Show/hide income proof document based on employment type
    if (employmentType === 'non-individual') {
        if (incomeProofDocument) {
            incomeProofDocument.style.display = 'none';
            console.log('Income Proof Document: HIDDEN (non-individual)');
        }
    } else {
        // For individual users, ALWAYS show income proof document
        if (incomeProofDocument) {
            incomeProofDocument.style.display = 'block';
            console.log('Income Proof Document: SHOWN (individual user)');
        } else {
            console.error('Income Proof Document not found for individual user!');
        }
    }

    // Update required documents check
    checkAllDocumentsUploaded();
}

// Call setup on DOM load
document.addEventListener('DOMContentLoaded', setupUploadHandlers);

// Keyboard navigation
document.addEventListener('keydown', function(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        const activeElement = document.activeElement;
        if (activeElement.tagName === 'INPUT' && activeElement.type !== 'checkbox') {
            event.preventDefault();
            const nextBtn = document.querySelector('.next-btn');
            if (nextBtn && nextBtn.style.display !== 'none') {
                nextBtn.click();
            }
        }
    }
});

// Demo functions for testing
function simulateSteps() {
    // Fill demo data
    document.getElementById('fullName').value = 'John Doe';
    document.getElementById('mobile').value = '9876543210';
    document.getElementById('loanAmount').value = '500000';
    document.getElementById('panNumber').value = 'ABCDE1234F';
    document.getElementById('agreeOVD').checked = true;

    saveFormData();
    alert('Demo data filled. You can now navigate through the steps.');
}

// Auto-calculation setup
function setupAutoCalculations() {
    // Individual form calculations
    const grossIncomeInput = document.getElementById('grossMonthlyIncome');
    const bonusInput = document.getElementById('bonusOvertimeArrear');
    const totalIncomeInput = document.getElementById('totalIncome');
    const obligationInput = document.getElementById('totalMonthlyObligation');
    const netSalaryInput = document.getElementById('netMonthlySalary');

    function calculateTotals() {
        const grossIncome = parseFloat(grossIncomeInput?.value || 0);
        const bonus = parseFloat(bonusInput?.value || 0);
        const obligation = parseFloat(obligationInput?.value || 0);

        const totalIncome = grossIncome - bonus;
        const netSalary = totalIncome - obligation;

        if (totalIncomeInput) totalIncomeInput.value = totalIncome.toFixed(2);
        if (netSalaryInput) netSalaryInput.value = netSalary.toFixed(2);
    }

    [grossIncomeInput, bonusInput, obligationInput].forEach(input => {
        if (input) {
            input.addEventListener('input', calculateTotals);
            input.addEventListener('change', calculateTotals);
        }
    });

    // Add formatting for loan amount inputs with better event handling
    const loanAmountInput = document.getElementById('loanAmount');
    if (loanAmountInput) {
        loanAmountInput.addEventListener('input', function(e) {
            formatLoanAmountDisplay(this);
        });
        loanAmountInput.addEventListener('keydown', function(e) {
            // Allow: backspace, delete, tab, escape, enter and .
            if ([46, 8, 9, 27, 13, 110, 190].indexOf(e.keyCode) !== -1 ||
                // Allow: Ctrl+A, Command+A
                (e.keyCode === 65 && (e.ctrlKey === true || e.metaKey === true)) ||
                // Allow: Ctrl+C, Command+C
                (e.keyCode === 67 && (e.ctrlKey === true || e.metaKey === true)) ||
                // Allow: Ctrl+V, Command+V
                (e.keyCode === 86 && (e.ctrlKey === true || e.metaKey === true)) ||
                // Allow: Ctrl+X, Command+X
                (e.keyCode === 88 && (e.ctrlKey === true || e.metaKey === true)) ||
                // Allow: home, end, left, right, down, up
                (e.keyCode >= 35 && e.keyCode <= 40)) {
                // Let it happen, don't do anything
                return;
            }
            // Ensure that it is a number and stop the keypress
            if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
                e.preventDefault();
            }
        });
    }

    const businessLoanAmountInput = document.getElementById('businessLoanAmount');
    if (businessLoanAmountInput) {
        businessLoanAmountInput.addEventListener('input', function(e) {
            formatBusinessLoanAmountDisplay(this);
        });
        businessLoanAmountInput.addEventListener('keydown', function(e) {
            // Allow: backspace, delete, tab, escape, enter and .
            if ([46, 8, 9, 27, 13, 110, 190].indexOf(e.keyCode) !== -1 ||
                // Allow: Ctrl+A, Command+A
                (e.keyCode === 65 && (e.ctrlKey === true || e.metaKey === true)) ||
                // Allow: Ctrl+C, Command+C
                (e.keyCode === 67 && (e.ctrlKey === true || e.metaKey === true)) ||
                // Allow: Ctrl+V, Command+V
                (e.keyCode === 86 && (e.ctrlKey === true || e.metaKey === true)) ||
                // Allow: Ctrl+X, Command+X
                (e.keyCode === 88 && (e.ctrlKey === true || e.metaKey === true)) ||
                // Allow: home, end, left, right, down, up
                (e.keyCode >= 35 && e.keyCode <= 40)) {
                // Let it happen, don't do anything
                return;
            }
            // Ensure that it is a number and stop the keypress
            if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
                e.preventDefault();
            }
        });
    }

    // Non-individual form calculations
    const grossAnnualInput = document.getElementById('grossAnnualIncome');
    const otherAnnualInput = document.getElementById('otherAnnualIncome');
    const netAnnualInput = document.getElementById('netAnnualIncome');

    function calculateAnnualTotals() {
        const grossAnnual = parseFloat(grossAnnualInput?.value || 0);
        const otherAnnual = parseFloat(otherAnnualInput?.value || 0);

        const netAnnual = grossAnnual + otherAnnual;

        if (netAnnualInput) netAnnualInput.value = netAnnual.toFixed(2);
    }

    [grossAnnualInput, otherAnnualInput].forEach(input => {
        if (input) {
            input.addEventListener('input', calculateAnnualTotals);
            input.addEventListener('change', calculateAnnualTotals);
        }
    });
}

// Tenure slider setup
function setupTenureSlider() {
    const slider = document.getElementById('tenureSlider');
    const display = document.getElementById('tenureDisplay');
    const emiDisplay = document.getElementById('dynamicEMI');

    if (slider && display) {
        slider.addEventListener('input', function() {
            const tenure = parseInt(this.value);
            display.textContent = tenure;
            formData.tenure = tenure;
            calculateEMI();
        });
    }
}

// EMI Calculation
function calculateEMI() {
    // Ensure we have valid numeric values
    let principal = formData.loanAmount;
    if (!principal || isNaN(principal) || principal <= 0) {
        principal = 1000000; // Default to 10 lakhs
    }
    
    let rate = formData.interestRate;
    if (!rate || isNaN(rate) || rate <= 0) {
        rate = 8.5; // Default rate
    }
    
    let tenure = formData.tenure;
    if (!tenure || isNaN(tenure) || tenure <= 0) {
        tenure = 84; // Default tenure
    }

    const monthlyRate = rate / 100 / 12;
    const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, tenure)) / (Math.pow(1 + monthlyRate, tenure) - 1);

    const emiDisplay = document.getElementById('dynamicEMI');
    if (emiDisplay) {
        // Check if EMI calculation is valid
        if (isNaN(emi) || !isFinite(emi)) {
            emiDisplay.innerHTML = `₹5,500 p.m.<br><small>(Five Thousand Five Hundred Rupees Only per month)</small>`;
        } else {
            const roundedEMI = Math.round(emi);
            const emiInWords = formatAmountInWords(roundedEMI);
            emiDisplay.innerHTML = `₹${formatAmountWithCommas(roundedEMI)} p.m.<br><small>(${emiInWords} per month)</small>`;
        }
    }

    // Update other displays
    const loanAmountDisplay = document.getElementById('displayLoanAmount');
    const interestRateDisplay = document.getElementById('displayInterestRate');

    if (loanAmountDisplay) {
        const formattedAmount = formatAmountWithCommas(principal);
        const amountInWords = formatAmountInWords(principal);
        loanAmountDisplay.innerHTML = `₹${formattedAmount}<br><small>(${amountInWords})</small>`;
    }

    if (interestRateDisplay) {
        interestRateDisplay.textContent = rate.toFixed(2);
    }
}

// Enhanced validation functions
function validateMobile(mobile) {
    return /^[6-9]\d{9}$/.test(mobile);
}

function validatePAN(pan) {
    return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan);
}

function validateAadhar(aadhar) {
    return /^\d{12}$/.test(aadhar.replace(/\s/g, ''));
}

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePinCode(pinCode) {
    return /^\d{6}$/.test(pinCode);
}

function validateGSTNumber(gst) {
    return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gst);
}

// UI Helper functions
function showLoading() {
    document.getElementById('loadingOverlay').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loadingOverlay').style.display = 'none';
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;

    const container = document.querySelector('.step-content:not([style*="display: none"])');
    if (container) {
        container.insertBefore(errorDiv, container.firstChild);
        setTimeout(() => errorDiv.remove(), 5000);
    }
}

function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'error-message';
    successDiv.style.backgroundColor = '#d4edda';
    successDiv.style.color = '#155724';
    successDiv.style.borderColor = '#c3e6cb';
    successDiv.textContent = message;

    const container = document.querySelector('.step-content:not([style*="display: none"])');
    if (container) {
        container.insertBefore(successDiv, container.firstChild);
        setTimeout(() => successDiv.remove(), 3000);
    }
}

// Application date setup
function setApplicationDate() {
    const dateElement = document.getElementById('applicationDate');
    if (dateElement) {
        dateElement.textContent = new Date().toLocaleDateString('en-IN');
    }
}

// Thank you page functions
function showThankYou() {
    showLoading();
    setTimeout(() => {
        hideLoading();
        currentStep = 7;
        updateStepDisplay();
    }, 2000);
}

// New function for loan acceptance
function acceptLoan() {
    showLoading();

    // Simulate processing
    setTimeout(() => {
        hideLoading();

        // Send notifications
        sendNotifications();

        // Show success message
        showNotification('🎉 Congratulations! Your loan has been approved. Notifications sent to your mobile and email.');

        // Move to thank you page
        setTimeout(() => {
            showThankYou();
        }, 3000);
    }, 2000);
}

// Download loan summary function
function downloadLoanSummary() {
    const loanData = {
        applicantName: formData.fullName || 'N/A',
        mobile: formData.mobile || 'N/A',
        email: formData.email || 'N/A',
        loanAmount: formData.loanAmount || 1000000,
        interestRate: formData.interestRate || 8.5,
        tenure: formData.tenure || 84,
        emi: calculateEMIValue(),
        applicationDate: new Date().toLocaleDateString('en-IN'),
        referenceNumber: 'LA2025082901'
    };

    const summaryText = `
LOAN APPLICATION SUMMARY
========================

Application Reference: ${loanData.referenceNumber}
Application Date: ${loanData.applicationDate}

APPLICANT DETAILS:
- Name: ${loanData.applicantName}
- Mobile: ${loanData.mobile}
- Email: ${loanData.email}

LOAN DETAILS:
- Loan Amount: Rs. ${loanData.loanAmount.toLocaleString('en-IN')}
- Rate of Interest: ${loanData.interestRate}% p.a.
- Tenure: ${loanData.tenure} months
- EMI: Rs. ${loanData.emi.toLocaleString('en-IN')} p.m.

CHARGES:
- Processing Charges: Rs. 1,180
- Login Fee + GST: Rs. 1,180

Status: IN-PRINCIPAL APPROVED

Thank you for choosing FinanceBank!
    `;

    // Create and download file
    const blob = new Blob([summaryText], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `loan_summary_${loanData.referenceNumber}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    showNotification('📄 Loan summary downloaded successfully!');
}

// Send notifications function
function sendNotifications() {
    const mobile = formData.mobile || '9876543210';
    const email = formData.email || 'user@example.com';

    // Simulate SMS notification
    console.log(`SMS sent to ${mobile}: 🎉 Congratulations! Your loan application has been approved. Reference: LA2025082901. Visit our branch to complete formalities. - FinanceBank`);

    // Simulate Email notification
    console.log(`Email sent to ${email}: Your loan application has been approved! Please check your application portal for next steps. Reference: LA2025082901`);
}

function restartApplication() {
    if (confirm('Are you sure you want to start a new application? All current data will be lost.')) {
        resetApplication();
    }
}

function downloadSummary() {
    showLoading();
    setTimeout(() => {
        hideLoading();
        alert('Application summary has been downloaded to your device.');
    }, 1500);
}

// Notification functions
function showNotification(message, type = 'success') {
    const toast = document.getElementById('notificationToast');
    const messageElement = toast.querySelector('.notification-message');
    const iconElement = toast.querySelector('.notification-icon');

    messageElement.textContent = message;

    // Set icon based on type
    if (type === 'success') {
        iconElement.textContent = '✅';
        toast.style.backgroundColor = '#d4edda';
        toast.style.borderColor = '#c3e6cb';
    } else if (type === 'error') {
        iconElement.textContent = '❌';
        toast.style.backgroundColor = '#f8d7da';
        toast.style.borderColor = '#f5c6cb';
    }

    toast.style.display = 'block';

    // Auto hide after 5 seconds
    setTimeout(() => {
        hideNotification();
    }, 5000);
}

function hideNotification() {
    const toast = document.getElementById('notificationToast');
    toast.style.display = 'none';
}

// Calculate EMI value for downloads
function calculateEMIValue() {
    const principal = formData.loanAmount || 1000000;
    const rate = (formData.interestRate || 8.5) / 100 / 12;
    const tenure = formData.tenure || 84;

    const emi = (principal * rate * Math.pow(1 + rate, tenure)) / (Math.pow(1 + rate, tenure) - 1);
    return Math.round(emi);
}

// Update loan type button handlers
function updateLoanTypeHandlers() {
    const loanTypeButtons = document.querySelectorAll('.loan-type-btn');
    loanTypeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const group = this.closest('.selection-group');
            const buttons = group.querySelectorAll('.loan-type-btn');
            buttons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');

            // Handle loan type selection to show/hide sub-type
            if (this.dataset.value === 'vehicle') {
                const subTypeSection = document.getElementById('loan-sub-type');
                if (subTypeSection) subTypeSection.style.display = 'block';
            } else {
                const subTypeSection = document.getElementById('loan-sub-type');
                if (subTypeSection) subTypeSection.style.display = 'none';
            }
        });
    });
}

// Call update handlers on DOM load
document.addEventListener('DOMContentLoaded', updateLoanTypeHandlers);



// PDF Preview Functions
function showDocumentPreview(documentId) {
    const document = uploadedDocuments[documentId];
    if (!document || !document.fileURL) {
        showError('Document not found or preview not available');
        return;
    }

    // Store current document ID for download functionality
    window.currentPreviewDocId = documentId;

    const modal = document.getElementById('documentPreviewModal');
    const previewContent = document.getElementById('previewContent');
    const documentTitle = document.getElementById('documentTitle');

    // Set document title
    documentTitle.textContent = document.name;

    // Clear previous content
    previewContent.innerHTML = '';

    if (document.type === 'application/pdf') {
        // For PDF files, embed the PDF viewer with responsive sizing
        const embed = document.createElement('embed');
        embed.src = document.fileURL;
        embed.type = 'application/pdf';
        embed.style.width = '100%';
        embed.style.height = getResponsiveHeight();
        embed.style.borderRadius = '8px';
        embed.style.border = 'none';
        embed.style.minHeight = '400px';
        previewContent.appendChild(embed);
    } else if (document.type.startsWith('image/')) {
        // For image files, show the image with responsive sizing
        const img = document.createElement('img');
        img.src = document.fileURL;
        img.style.width = '100%';
        img.style.height = 'auto';
        img.style.maxHeight = getResponsiveHeight();
        img.style.objectFit = 'contain';
        img.style.borderRadius = '8px';
        img.style.display = 'block';
        img.style.margin = '0 auto';
        img.onload = function() {
            console.log('Image loaded successfully');
        };
        img.onerror = function() {
            console.error('Failed to load image');
            previewContent.innerHTML = '<p style="text-align: center; color: #666;">Failed to load image preview</p>';
        };
        previewContent.appendChild(img);
    } else {
        // For other file types, show a message
        const message = document.createElement('div');
        message.className = 'preview-message';
        message.innerHTML = `
            <div class="file-icon">📄</div>
            <h3>${document.name}</h3>
            <p>Preview not available for this file type</p>
            <p>Size: ${(document.size / 1024 / 1024).toFixed(2)} MB</p>
            <p>Click download to view the file</p>
        `;
        previewContent.appendChild(message);
    }

    modal.style.display = 'block';

    // Prevent body scrolling when modal is open
    document.body.style.overflow = 'hidden';
}

// Helper function to get responsive height for preview content
function getResponsiveHeight() {
    const screenHeight = window.innerHeight;
    const screenWidth = window.innerWidth;

    if (screenWidth <= 480) {
        return Math.max(screenHeight * 0.6, 300) + 'px';
    } else if (screenWidth <= 768) {
        return Math.max(screenHeight * 0.7, 400) + 'px';
    } else {
        return Math.max(screenHeight * 0.75, 500) + 'px';
    }
}

function closeDocumentPreview() {
    const modal = document.getElementById('documentPreviewModal');
    modal.style.display = 'none';

    // Restore body scrolling when modal is closed
    document.body.style.overflow = 'auto';
}

function downloadDocument(documentId) {
    const document = uploadedDocuments[documentId];
    if (!document || !document.fileURL) {
        showError('Document not found');
        return;
    }

    // Create download link
    const link = document.createElement('a');
    link.href = document.fileURL;
    link.download = document.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showNotification(`📥 ${document.name} downloaded successfully!`);
}

// Document upload preview function
function openDocumentPreview(documentType, fileName, documentId) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.jpg,.jpeg,.png';
    input.onchange = function(event) {
        const file = event.target.files[0];
        if (file) {
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                showError('File size should not exceed 5MB');
                return;
            }

            // Get the upload button element
            const uploadBox = document.getElementById(documentId);
            const buttonElement = uploadBox ? uploadBox.querySelector('.upload-btn') : null;

            // Process all documents directly without verification
            processFileUpload(file, documentId, documentType, buttonElement);
        }
    };
    input.click();
}

// Bank verification system
function showBankVerificationModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'bankVerificationModal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-modal" onclick="closeBankVerificationModal()">&times;</span>
            <h3>Bank Account Verification</h3>
            <form id="bankVerificationForm">
                <div class="bank-form-group">
                    <label for="accountNumber">Account Number</label>
                    <input type="text" id="accountNumber" required>
                </div>
                <div class="bank-form-group">
                    <label for="confirmAccountNumber">Confirm Account Number</label>
                    <input type="text" id="confirmAccountNumber" required>
                </div>
                <div class="bank-form-group">
                    <label for="ifscCode">IFSC Code</label>
                    <input type="text" id="ifscCode" required>
                </div>
                <div class="bank-form-group">
                    <label for="bankName">Bank Name</label>
                    <input type="text" id="bankName" required>
                </div>
                <div class="bank-form-group">
                    <label for="accountHolderName">Account Holder Name</label>
                    <input type="text" id="accountHolderName" required>
                </div>
                <div class="modal-actions">
                    <button type="button" class="cancel-btn" onclick="closeBankVerificationModal()">Cancel</button>
                    <button type="button" class="verify-btn" onclick="verifyBankAccount()">Verify Account</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
    modal.style.display = 'block';
}

function closeBankVerificationModal() {
    const modal = document.getElementById('bankVerificationModal');
    if (modal) {
        modal.remove();
    }
}

function verifyBankAccount() {
    const accountNumber = document.getElementById('accountNumber').value;
    const confirmAccountNumber = document.getElementById('confirmAccountNumber').value;
    const ifscCode = document.getElementById('ifscCode').value;
    const bankName = document.getElementById('bankName').value;
    const accountHolderName = document.getElementById('accountHolderName').value;

    // Validation
    if (!accountNumber || !confirmAccountNumber || !ifscCode || !bankName || !accountHolderName) {
        showError('Please fill all bank details');
        return;
    }

    if (accountNumber !== confirmAccountNumber) {
        showError('Account numbers do not match');
        return;
    }

    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscCode)) {
        showError('Please enter a valid IFSC code');
        return;
    }

    showLoading();

    // Simulate bank verification
    setTimeout(() => {
        hideLoading();

        // Save bank details
        formData.bankDetails = {
            accountNumber,
            ifscCode,
            bankName,
            accountHolderName,
            verified: true
        };

        showSuccess('Bank account verified successfully!');
        closeBankVerificationModal();

        // Update bank statement upload to show verified status
        const bankStatementBox = document.getElementById('bankStatement');
        if (bankStatementBox) {
            const verifyBtn = bankStatementBox.querySelector('.verify-bank-btn');
            if (verifyBtn) {
                verifyBtn.textContent = '✓ Verified';
                verifyBtn.style.backgroundColor = '#28a745';
                verifyBtn.disabled = true;
            }
        }
    }, 2000);
}

// Dealer Invoice Verification Modal
function showDealerVerificationModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'dealerVerificationModal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-modal" onclick="closeDealerVerificationModal()">&times;</span>
            <h3>Dealer Invoice Verification</h3>
            <form id="dealerVerificationForm">
                <div class="bank-form-group">
                    <label for="dealerName">Dealer Name</label>
                    <input type="text" id="dealerName" required>
                </div>
                <div class="bank-form-group">
                    <label for="invoiceNumber">Invoice Number</label>
                    <input type="text" id="invoiceNumber" required>
                </div>
                <div class="bank-form-group">
                    <label for="vehicleModel">Vehicle Model</label>
                    <input type="text" id="vehicleModel" required>
                </div>
                <div class="bank-form-group">
                    <label for="invoiceAmount">Invoice Amount</label>
                    <input type="number" id="invoiceAmount" required>
                </div>
                <div class="bank-form-group">
                    <label for="invoiceDate">Invoice Date</label>
                    <input type="date" id="invoiceDate" required>
                </div>
                <div class="modal-actions">
                    <button type="button" class="cancel-btn" onclick="closeDealerVerificationModal()">Cancel</button>
                    <button type="button" class="verify-btn" onclick="verifyDealerInvoice()">Verify Invoice</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
    modal.style.display = 'block';
}

function closeDealerVerificationModal() {
    const modal = document.getElementById('dealerVerificationModal');
    if (modal) {
        modal.remove();
    }
}

function verifyDealerInvoice() {
    const dealerName = document.getElementById('dealerName').value;
    const invoiceNumber = document.getElementById('invoiceNumber').value;
    const vehicleModel = document.getElementById('vehicleModel').value;
    const invoiceAmount = document.getElementById('invoiceAmount').value;
    const invoiceDate = document.getElementById('invoiceDate').value;

    // Validation
    if (!dealerName || !invoiceNumber || !vehicleModel || !invoiceAmount || !invoiceDate) {
        showError('Please fill all dealer invoice details');
        return;
    }

    showLoading();

    // Simulate dealer verification
    setTimeout(() => {
        hideLoading();

        // Save dealer details
        formData.dealerDetails = {
            dealerName,
            invoiceNumber,
            vehicleModel,
            invoiceAmount,
            invoiceDate,
            verified: true
        };

        showSuccess('Dealer invoice verified successfully!');
        closeDealerVerificationModal();

        // Update dealer invoice upload to show verified status
        const dealerInvoiceBox = document.getElementById('dealerInvoice');
        if (dealerInvoiceBox) {
            const verifyBtn = dealerInvoiceBox.querySelector('.verify-dealer-btn');
            if (verifyBtn) {
                verifyBtn.textContent = '✓ Verified';
                verifyBtn.style.backgroundColor = '#28a745';
                verifyBtn.disabled = true;
            }
        }
    }, 2000);
}

// GST Verification Modal
function showGSTVerificationModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'gstVerificationModal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-modal" onclick="closeGSTVerificationModal()">&times;</span>
            <h3>GST Certificate Verification</h3>
            <form id="gstVerificationForm">
                <div class="bank-form-group">
                    <label for="gstNumber">GST Number</label>
                    <input type="text" id="gstNumber" required>
                </div>
                <div class="bank-form-group">
                    <label for="businessName">Business Name</label>
                    <input type="text" id="businessName" required>
                </div>
                <div class="bank-form-group">
                    <label for="businessAddress">Business Address</label>
                    <input type="text" id="businessAddress" required>
                </div>
                <div class="bank-form-group">
                    <label for="gstStatus">GST Status</label>
                    <select id="gstStatus" required>
                        <option value="">Select Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>
                <div class="modal-actions">
                    <button type="button" class="cancel-btn" onclick="closeGSTVerificationModal()">Cancel</button>
                    <button type="button" class="verify-btn" onclick="verifyGST()">Verify GST</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
    modal.style.display = 'block';
}

function closeGSTVerificationModal() {
    const modal = document.getElementById('gstVerificationModal');
    if (modal) {
        modal.remove();
    }
}

function verifyGST() {
    const gstNumber = document.getElementById('gstNumber').value;
    const businessName = document.getElementById('businessName').value;
    const businessAddress = document.getElementById('businessAddress').value;
    const gstStatus = document.getElementById('gstStatus').value;

    // Validation
    if (!gstNumber || !businessName || !businessAddress || !gstStatus) {
        showError('Please fill all GST details');
        return;
    }

    if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstNumber)) {
        showError('Please enter a valid GST number');
        return;
    }

    showLoading();

    // Simulate GST verification
    setTimeout(() => {
        hideLoading();

        // Save GST details
        formData.gstDetails = {
            gstNumber,
            businessName,
            businessAddress,
            gstStatus,
            verified: true
        };

        showSuccess('GST certificate verified successfully!');
        closeGSTVerificationModal();

        // Update GST upload to show verified status
        const gstBox = document.getElementById('gstDoc');
        if (gstBox) {
            const verifyBtn = gstBox.querySelector('.verify-gst-btn');
            if (verifyBtn) {
                verifyBtn.textContent = '✓ Verified';
                verifyBtn.style.backgroundColor = '#28a745';
                verifyBtn.disabled = true;
            }
        }
    }, 2000);
}

// ITR Verification Modal
function showITRVerificationModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'itrVerificationModal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-modal" onclick="closeITRVerificationModal()">&times;</span>
            <h3>ITR Document Verification</h3>
            <form id="itrVerificationForm">
                <div class="bank-form-group">
                    <label for="assessmentYear">Assessment Year</label>
                    <input type="text" id="assessmentYear" placeholder="e.g., 2023-24" required>
                </div>
                <div class="bank-form-group">
                    <label for="totalIncome">Total Income</label>
                    <input type="number" id="totalIncome" required>
                </div>
                <div class="bank-form-group">
                    <label for="taxPaid">Tax Paid</label>
                    <input type="number" id="taxPaid" required>
                </div>
                <div class="bank-form-group">
                    <label for="acknowledgmentNumber">Acknowledgment Number</label>
                    <input type="text" id="acknowledgmentNumber" required>
                </div>
                <div class="modal-actions">
                    <button type="button" class="cancel-btn" onclick="closeITRVerificationModal()">Cancel</button>
                    <button type="button" class="verify-btn" onclick="verifyITR()">Verify ITR</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
    modal.style.display = 'block';
}

function closeITRVerificationModal() {
    const modal = document.getElementById('itrVerificationModal');
    if (modal) {
        modal.remove();
    }
}

function verifyITR() {
    const assessmentYear = document.getElementById('assessmentYear').value;
    const totalIncome = document.getElementById('totalIncome').value;
    const taxPaid = document.getElementById('taxPaid').value;
    const acknowledgmentNumber = document.getElementById('acknowledgmentNumber').value;

    // Validation
    if (!assessmentYear || !totalIncome || !taxPaid || !acknowledgmentNumber) {
        showError('Please fill all ITR details');
        return;
    }

    showLoading();

    // Simulate ITR verification
    setTimeout(() => {
        hideLoading();

        // Save ITR details
        formData.itrDetails = {
            assessmentYear,
            totalIncome,
            taxPaid,
            acknowledgmentNumber,
            verified: true
        };

        showSuccess('ITR document verified successfully!');
        closeITRVerificationModal();

        // Update ITR upload to show verified status
        const itrBox = document.getElementById('itrDoc');
        if (itrBox) {
            const verifyBtn = itrBox.querySelector('.verify-itr-btn');
            if (verifyBtn) {
                verifyBtn.textContent = '✓ Verified';
                verifyBtn.style.backgroundColor = '#28a745';
                verifyBtn.disabled = true;
            }
        }
    }, 2000);
}

// Updated function to show verification popup instead of direct upload
function handleDocumentUpload(documentId) {
    // Map document IDs to their types for proper verification
    const documentTypeMap = {
        'bankStatement': 'bankStatement',
        'dealerInvoice': 'dealerInvoice', 
        'gstDoc': 'gstDoc',
        'incomeProofDoc': 'incomeProofDoc'
    };
    
    const documentType = documentTypeMap[documentId] || documentId;
    showDocumentVerificationPopup(documentType, documentId);
}

// OTP Verification Functions
let otpTimer;
let otpTimeRemaining = 120; // 2 minutes

function showOTPModal(mobileNumber) {
    // Close any existing verification modals first
    closeAllVerificationModals();

    const modal = document.getElementById('otpVerificationModal');
    const mobileDisplay = document.getElementById('otpMobileNumber');

    if (mobileDisplay) {
        mobileDisplay.textContent = mobileNumber;
    }
    if (modal) {
        modal.style.display = 'block';
    }

    // Start OTP timer
    startOTPTimer();

    // Focus on OTP input with better error handling
    setTimeout(() => {
        const firstOtpInput = document.getElementById('otp1');
        if (firstOtpInput) {
            firstOtpInput.focus();
        }
    }, 100);
}

function closeOTPModal() {
    const modal = document.getElementById('otpVerificationModal');
    if (modal) {
        modal.style.display = 'none';
    }

    // Clear timer
    if (otpTimer) {
        clearInterval(otpTimer);
        otpTimer = null;
    }

    // Reset values with error handling
    const otpInputs = ['otp1', 'otp2', 'otp3', 'otp4', 'otp5', 'otp6'];
    otpInputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            input.value = '';
        }
    });
    otpTimeRemaining = 120;
}

function startOTPTimer() {
    const timerDisplay = document.getElementById('otpTimer');
    const resendBtn = document.getElementById('resendOtpBtn');

    otpTimeRemaining = 120;
    resendBtn.disabled = true;
    resendBtn.textContent = 'Resend OTP';

    otpTimer = setInterval(() => {
        otpTimeRemaining--;

        const minutes = Math.floor(otpTimeRemaining / 60);
        const seconds = otpTimeRemaining % 60;
        timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        if (otpTimeRemaining <= 0) {
            clearInterval(otpTimer);
            resendBtn.disabled = false;
            resendBtn.textContent = 'Resend OTP';
            timerDisplay.textContent = '00:00';
        }
    }, 1000);
}

function resendOTP() {
    const mobileNumber = document.getElementById('otpMobileNumber').textContent;

    showLoading();
    setTimeout(() => {
        hideLoading();
        showSuccess(`New OTP sent to ${mobileNumber}`);
        startOTPTimer();
    }, 1000);
}

function verifyOTP() {
    // Collect values from all 6 individual digit inputs with better error handling
    const otpInputs = ['otp1', 'otp2', 'otp3', 'otp4', 'otp5', 'otp6'];
    const otpValues = otpInputs.map(id => {
        const element = document.getElementById(id);
        return element ? element.value.trim() : '';
    });

    const otpInput = otpValues.join('');

    if (!otpInput || otpInput.length !== 6) {
        showError('Please enter all 6 digits of the OTP');
        return;
    }

    // Validate OTP (accept any 6-digit number for demo)
    if (!/^\d{6}$/.test(otpInput)) {
        showError('OTP must be 6 digits only');
        return;
    }

    showLoading();
    setTimeout(() => {
        hideLoading();

        // Find the verify button that was clicked
        const mobileNumber = document.getElementById('otpMobileNumber').textContent;
        const mobileInputs = document.querySelectorAll('.mobile-input-container input[type="text"]');
        let targetVerifyBtn = null;

        mobileInputs.forEach(input => {
            if (input.value === mobileNumber) {
                const container = input.closest('.mobile-input-container');
                targetVerifyBtn = container.querySelector('.verify-btn');
            }
        });

        if (targetVerifyBtn) {
            targetVerifyBtn.textContent = '✓ Verified';
            targetVerifyBtn.style.background = 'linear-gradient(135deg, #28a745, #20c997)';
            targetVerifyBtn.disabled = true;
            window.ovdVerified = true; // Set OVD verification flag
        }

        closeOTPModal();
        showSuccess('Mobile number verified successfully!');
    }, 1500);
}

// Helper functions for OTP input handling
function moveToNext(currentInput, nextInputId) {
    if (!currentInput) {
        console.error('Current input element is null');
        return;
    }

    if (!currentInput.value) {
        return;
    }

    // Only allow numeric input
    currentInput.value = currentInput.value.replace(/[^0-9]/g, '');

    if (currentInput.value.length === 1 && nextInputId) {
        const nextInput = document.getElementById(nextInputId);
        if (nextInput) {
            nextInput.focus();
        } else {
            console.error(`Next input element ${nextInputId} not found`);
        }
    }
}

function handleBackspace(currentInput, prevInputId) {
    if (!currentInput) {
        console.error('Current input element is null');
        return;
    }

    // Use event parameter from the onkeydown attribute
    if (!window.event && !event) {
        console.error('Event object is null');
        return;
    }

    const keyEvent = window.event || event;

    if (keyEvent.key === 'Backspace' && currentInput.value.length === 0 && prevInputId) {
        const prevInput = document.getElementById(prevInputId);
        if (prevInput) {
            prevInput.focus();
        } else {
            console.error(`Previous input element ${prevInputId} not found`);
        }
    }
}

function showTJSBConsentModal() {
    const modal = document.getElementById('tjsbConsentModal');
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
}

function closeTJSBConsentModal() {
    const modal = document.getElementById('tjsbConsentModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

function agreeTJSBConsent() {
    const checkbox = document.getElementById('agreeTJSBConsent');
    if (checkbox) {
        checkbox.checked = true;
        showSuccess('Consent agreed successfully!');
    }
    closeTJSBConsentModal();
}

// TJSB Personal Consent Modal Functions (for Personal Details step)
function handleTJSBPersonalConsentClick(event) {
    // Prevent the checkbox from being checked automatically
    event.preventDefault();
    showTJSBPersonalConsentModal();
}

function showTJSBPersonalConsentModal() {
    const modal = document.getElementById('tjsbPersonalConsentModal');
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
}

function closeTJSBPersonalConsentModal() {
    const modal = document.getElementById('tjsbPersonalConsentModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

function agreeTJSBPersonalConsent() {
    const employmentType = formData.employmentType || 'individual';
    
    // Determine which checkbox to check based on employment type
    const checkboxId = employmentType === 'non-individual' ? 'agreeTJSBPersonalConsentCompany' : 'agreeTJSBPersonalConsent';
    const checkbox = document.getElementById(checkboxId);
    
    if (checkbox) {
        checkbox.checked = true;
        
        // Create a verified status indicator
        const checkboxGroup = checkbox.closest('.checkbox-group');
        let verifiedIndicator = checkboxGroup.querySelector('.consent-verified');
        
        if (!verifiedIndicator) {
            verifiedIndicator = document.createElement('span');
            verifiedIndicator.className = 'consent-verified';
            verifiedIndicator.innerHTML = ' <span style="color: #28a745; font-weight: bold;">✓ Verified</span>';
            checkboxGroup.appendChild(verifiedIndicator);
        }
        
        // Mark as verified in form data
        window.tjsbPersonalConsentVerified = true;
        
        showSuccess('TJSB Bank consent agreed successfully and verified!');
    }
    closeTJSBPersonalConsentModal();
}

// OVD Functions
function updateOVDFields() {
    const ovdType = document.getElementById('ovdType').value;
    const ovdNumberGroup = document.getElementById('ovdNumberGroup');
    const ovdVerifyGroup = document.getElementById('ovdVerifyGroup');
    const ovdConsentGroup = document.getElementById('ovdConsentGroup');
    const aadharInputContainer = document.getElementById('aadharInputContainer');
    const normalOVDInput = document.getElementById('ovdNumber');
    const ovdNumberLabel = document.getElementById('ovdNumberLabel');
    const ovdConsentLabel = document.getElementById('ovdConsentLabel');

    if (ovdType) {
        ovdNumberGroup.style.display = 'block';
        ovdVerifyGroup.style.display = 'block';
        ovdConsentGroup.style.display = 'block';

        // Configure fields based on OVD type with consistent structure
        switch(ovdType) {
            case 'aadhar':
                aadharInputContainer.style.display = 'block';
                normalOVDInput.style.display = 'none';
                ovdNumberLabel.textContent = 'Enter Your Aadhaar Number (12 digits)';
                normalOVDInput.setAttribute('maxlength', '12');
                normalOVDInput.setAttribute('pattern', '[0-9]{12}');
                normalOVDInput.setAttribute('placeholder', 'XXXX XXXX XXXX');
                ovdConsentLabel.innerHTML = `
                    <div class="aadhar-consent">
                        <p>a. I hereby provide my voluntary consent to TJSB SAHAKARI Bank to use the Aadhaar details provided by me for authentication and agree to the terms and conditions related to Aadhaar consent and updation.</p>
                        <p>b. I am aware that there are various alternate options provided by TJSB SAHAKARI Bank for establishing my identity/address proof and agree and confirm that for opening the online Account/Card/Loan/Investment, I have voluntarily submitted my Aadhaar number to the Bank and hereby give my consent to the Bank.</p>
                        <p>c. I hereby also agree with the terms pertaining to Aadhaar based authentication/verification.</p>
                        <small>(OTP will be sent to Mobile Number linked with Aadhaar Number.)</small>
                    </div>
                `;
                break;
                
            case 'passport':
                aadharInputContainer.style.display = 'none';
                normalOVDInput.style.display = 'block';
                ovdNumberLabel.textContent = 'Enter Your Passport Number (8 characters)';
                normalOVDInput.setAttribute('maxlength', '8');
                normalOVDInput.setAttribute('pattern', '[A-Z]{1}[0-9]{7}');
                normalOVDInput.setAttribute('placeholder', 'A1234567');
                ovdConsentLabel.textContent = 'I agree to validate my Passport details for identity verification.';
                break;
                
            case 'voter':
                aadharInputContainer.style.display = 'none';
                normalOVDInput.style.display = 'block';
                ovdNumberLabel.textContent = 'Enter Your Voter ID Number (10 characters)';
                normalOVDInput.setAttribute('maxlength', '10');
                normalOVDInput.setAttribute('pattern', '[A-Z]{3}[0-9]{7}');
                normalOVDInput.setAttribute('placeholder', 'ABC1234567');
                ovdConsentLabel.textContent = 'I agree to validate my Voter ID details for identity verification.';
                break;
                
            case 'driving':
                aadharInputContainer.style.display = 'none';
                normalOVDInput.style.display = 'block';
                ovdNumberLabel.textContent = 'Enter Your Driving License Number (up to 16 characters)';
                normalOVDInput.setAttribute('maxlength', '16');
                normalOVDInput.setAttribute('pattern', '[A-Z]{2}[0-9]{2}[A-Z0-9]{8,12}');
                normalOVDInput.setAttribute('placeholder', 'MH1420110062821');
                ovdConsentLabel.textContent = 'I agree to validate my Driving License details for identity verification.';
                break;
                
            default:
                aadharInputContainer.style.display = 'none';
                normalOVDInput.style.display = 'block';
                ovdNumberLabel.textContent = 'Enter OVD Number';
                normalOVDInput.removeAttribute('maxlength');
                normalOVDInput.removeAttribute('pattern');
                normalOVDInput.setAttribute('placeholder', 'Enter document number');
                ovdConsentLabel.textContent = 'I agree to validate my OVD details.';
        }
    } else {
        ovdNumberGroup.style.display = 'none';
        ovdVerifyGroup.style.display = 'none';
        ovdConsentGroup.style.display = 'none';
        
        // Reset input attributes
        normalOVDInput.removeAttribute('maxlength');
        normalOVDInput.removeAttribute('pattern');
        normalOVDInput.setAttribute('placeholder', 'Select OVD type first');
    }
}

function moveToNextAadhar(currentInput, nextInputId) {
    if (currentInput.value.length === 4 && nextInputId) {
        document.getElementById(nextInputId).focus();
    }
}

function toggleAadharVisibility() {
    const showAadhar = document.getElementById('showAadhar');
    if (!showAadhar) {
        console.error('Show Aadhar checkbox not found');
        return;
    }
    
    const isChecked = showAadhar.checked;
    const aadharInputs = ['aadharPart1', 'aadharPart2', 'aadharPart3'];

    aadharInputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            if (isChecked) {
                input.type = 'text';
            } else {
                input.type = 'password';
            }
        } else {
            console.error(`Aadhar input ${inputId} not found`);
        }
    });
}

function verifyOVDNumber() {
    const ovdType = document.getElementById('ovdType').value;

    if (!ovdType) {
        showError('Please select OVD type first');
        return;
    }

    let ovdNumber = '';
    let isValid = false;

    if (ovdType === 'aadhar') {
        const part1 = document.getElementById('aadharPart1').value;
        const part2 = document.getElementById('aadharPart2').value;
        const part3 = document.getElementById('aadharPart3').value;
        ovdNumber = part1 + part2 + part3;

        if (!part1 || !part2 || !part3 || ovdNumber.length !== 12) {
            showError('Please enter complete 12-digit Aadhaar number');
            return;
        }
        isValid = /^[0-9]{12}$/.test(ovdNumber);
    } else {
        ovdNumber = document.getElementById('ovdNumber').value.trim().toUpperCase();

        if (!ovdNumber) {
            showError(`Please enter your ${getOVDDisplayName(ovdType)} number`);
            return;
        }

        // Validate based on OVD type with proper patterns
        switch(ovdType) {
            case 'passport':
                isValid = /^[A-Z]{1}[0-9]{7}$/.test(ovdNumber) && ovdNumber.length === 8;
                if (!isValid) {
                    showError('Please enter valid Passport number (Format: A1234567)');
                    return;
                }
                break;
                
            case 'voter':
                isValid = /^[A-Z]{3}[0-9]{7}$/.test(ovdNumber) && ovdNumber.length === 10;
                if (!isValid) {
                    showError('Please enter valid Voter ID number (Format: ABC1234567)');
                    return;
                }
                break;
                
            case 'driving':
                isValid = /^[A-Z]{2}[0-9]{2}[A-Z0-9]{8,12}$/.test(ovdNumber) && ovdNumber.length >= 12 && ovdNumber.length <= 16;
                if (!isValid) {
                    showError('Please enter valid Driving License number (Format: MH1420110062821)');
                    return;
                }
                break;
                
            default:
                isValid = ovdNumber.length >= 6;
                if (!isValid) {
                    showError('Please enter valid document number');
                    return;
                }
        }
    }

    if (!isValid) {
        showError(`Please enter valid ${getOVDDisplayName(ovdType)} number`);
        return;
    }

    // Show loading first
    showLoading();
    
    // Simulate OTP sending with enhanced feedback
    setTimeout(() => {
        hideLoading();
        showSuccess(`OTP sent for ${getOVDDisplayName(ovdType)} verification`);
        // Show OVD OTP modal
        showOVDOTPModal(ovdType, ovdNumber);
    }, 1000);
}

// Helper function to get display name for OVD types
function getOVDDisplayName(ovdType) {
    const displayNames = {
        'aadhar': 'Aadhaar',
        'passport': 'Passport',
        'voter': 'Voter ID',
        'driving': 'Driving License'
    };
    return displayNames[ovdType] || ovdType.charAt(0).toUpperCase() + ovdType.slice(1);
}

// OVD OTP Verification Functions
let ovdOtpTimer;
let ovdOtpTimeRemaining = 120;

function showOVDOTPModal(ovdType, ovdNumber) {
    const modal = document.getElementById('ovdOTPModal');
    const ovdOTPDetails = document.getElementById('ovdOTPDetails');

    let displayText = '';
    if (ovdType === 'aadhar') {
        displayText = `Aadhar Number: ****-****-${ovdNumber.slice(-4)}`;
    } else {
        displayText = `${ovdType.charAt(0).toUpperCase() + ovdType.slice(1)} Number: ${ovdNumber}`;
    }

    if (ovdOTPDetails) {
        ovdOTPDetails.textContent = displayText;
    }
    if (modal) {
        modal.style.display = 'block';
    }

    // Start OVD OTP timer
    startOVDOTPTimer();

    // Focus on first OTP input
    setTimeout(() => {
        const firstOtpInput = document.getElementById('ovdOtp1');
        if (firstOtpInput) {
            firstOtpInput.focus();
        }
    }, 100);
}

function closeOVDOTPModal() {
    const modal = document.getElementById('ovdOTPModal');
    if (modal) {
        modal.style.display = 'none';
    }

    // Clear timer
    if (ovdOtpTimer) {
        clearInterval(ovdOtpTimer);
        ovdOtpTimer = null;
    }

    // Reset values
    const ovdOtpInputs = ['ovdOtp1', 'ovdOtp2', 'ovdOtp3', 'ovdOtp4', 'ovdOtp5', 'ovdOtp6'];
    ovdOtpInputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            input.value = '';
        }
    });
    ovdOtpTimeRemaining = 120;
}

function startOVDOTPTimer() {
    const timerDisplay = document.getElementById('ovdOtpTimer');
    const resendBtn = document.getElementById('resendOVDOtpBtn');

    ovdOtpTimeRemaining = 120;
    resendBtn.disabled = true;
    resendBtn.textContent = 'Resend OTP';

    ovdOtpTimer = setInterval(() => {
        ovdOtpTimeRemaining--;

        const minutes = Math.floor(ovdOtpTimeRemaining / 60);
        const seconds = ovdOtpTimeRemaining % 60;
        timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        if (ovdOtpTimeRemaining <= 0) {
            clearInterval(ovdOtpTimer);
            resendBtn.disabled = false;
            resendBtn.textContent = 'Resend OTP';
            timerDisplay.textContent = '00:00';
        }
    }, 1000);
}

function resendOVDOTP() {
    showLoading();
    setTimeout(() => {
        hideLoading();
        showSuccess('New OTP sent for OVD verification');
        startOVDOTPTimer();
    }, 1000);
}

function verifyOVDOTP() {
    const ovdOtpInputs = ['ovdOtp1', 'ovdOtp2', 'ovdOtp3', 'ovdOtp4', 'ovdOtp5', 'ovdOtp6'];
    const otpValues = ovdOtpInputs.map(id => {
        const element = document.getElementById(id);
        return element ? element.value.trim() : '';
    });

    const otpInput = otpValues.join('');

    if (!otpInput || otpInput.length !== 6) {
        showError('Please enter all 6 digits of the OTP');
        return;
    }

    if (!/^\d{6}$/.test(otpInput)) {
        showError('OTP must be 6 digits only');
        return;
    }

    // Accept any 6-digit OTP for demo (including 123456)
    showLoading();
    setTimeout(() => {
        hideLoading();

        // Mark OVD as verified
        window.ovdVerified = true;

        // Enable the consent checkbox
        const ovdConsentCheckbox = document.getElementById('agreeOVD');
        if (ovdConsentCheckbox) {
            ovdConsentCheckbox.disabled = false;
            ovdConsentCheckbox.checked = true;
        }

        // Update verify button
        const ovdVerifyBtn = document.getElementById('ovdVerifyBtn');
        if (ovdVerifyBtn) {
            ovdVerifyBtn.textContent = '✓ Verified';
            ovdVerifyBtn.style.backgroundColor = '#28a745';
            ovdVerifyBtn.disabled = true;
        }

        closeOVDOTPModal();
        showSuccess('OVD verified successfully! You can now proceed with the application.');
    }, 1500);
}

// Helper functions for OVD OTP input handling
function moveToNextOVD(currentInput, nextInputId) {
    if (!currentInput || !currentInput.value) {
        return;
    }

    currentInput.value = currentInput.value.replace(/[^0-9]/g, '');

    if (currentInput.value.length === 1 && nextInputId) {
        const nextInput = document.getElementById(nextInputId);
        if (nextInput) {
            nextInput.focus();
        }
    }
}

function handleOVDBackspace(currentInput, prevInputId) {
    if (!currentInput) {
        return;
    }

    const keyEvent = window.event || event;

    if (keyEvent.key === 'Backspace' && currentInput.value.length === 0 && prevInputId) {
        const prevInput = document.getElementById(prevInputId);
        if (prevInput) {
            prevInput.focus();
        }
    }
}

// Amount formatting function
function formatAmountWithCommas(amount) {
    // Ensure amount is a number before formatting
    if (typeof amount !== 'number') {
        amount = parseFloat(amount);
    }
    
    // Check if amount is valid
    if (isNaN(amount) || !isFinite(amount)) {
        return '0';
    }
    
    // Use Indian number formatting with commas
    return amount.toLocaleString('en-IN');
}

function formatLoanAmountDisplay(inputElement) {
    if (!inputElement) return;
    
    // Get cursor position before formatting
    const cursorPosition = inputElement.selectionStart || 0;
    const oldValue = inputElement.value || '';

    // Remove all non-digits
    let value = oldValue.replace(/[^0-9]/g, '');
    const wordsDiv = document.getElementById('loanAmountWords');

    if (value && value.length > 0) {
        const numericValue = parseInt(value, 10);
        
        // Validate the numeric value
        if (!isNaN(numericValue) && numericValue > 0) {
            const formattedValue = formatAmountWithCommas(numericValue);
            inputElement.value = formattedValue;

            // Calculate new cursor position
            const oldLength = oldValue.length;
            const newLength = formattedValue.length;
            const newCursorPosition = Math.min(cursorPosition + (newLength - oldLength), newLength);

            // Set cursor position after a brief delay
            setTimeout(() => {
                try {
                    inputElement.setSelectionRange(newCursorPosition, newCursorPosition);
                } catch (e) {
                    // Ignore cursor positioning errors
                }
            }, 0);

            if (wordsDiv) {
                wordsDiv.textContent = formatAmountInWords(numericValue);
            }
            formData.loanAmount = numericValue;
        }
    } else {
        inputElement.value = '';
        if (wordsDiv) {
            wordsDiv.textContent = '';
        }
        formData.loanAmount = 1000000; // Default value
    }
}

function formatBusinessLoanAmountDisplay(inputElement) {
    // Get cursor position before formatting
    const cursorPosition = inputElement.selectionStart;
    const oldValue = inputElement.value;

    // Remove all non-digits
    let value = inputElement.value.replace(/[^0-9]/g, '');
    const wordsDiv = document.getElementById('businessLoanAmountWords');

    if (value) {
        const numericValue = parseInt(value, 10);
        const formattedValue = formatAmountWithCommas(numericValue);
        inputElement.value = formattedValue;

        // Calculate new cursor position
        const oldLength = oldValue.length;
        const newLength = formattedValue.length;
        const newCursorPosition = Math.min(cursorPosition + (newLength - oldLength), newLength);

        // Set cursor position after a brief delay
        setTimeout(() => {
            inputElement.setSelectionRange(newCursorPosition, newCursorPosition);
        }, 0);

        if (wordsDiv) {
            wordsDiv.textContent = formatAmountInWords(numericValue);
        }
        formData.loanAmount = numericValue;
    } else {
        inputElement.value = '';
        if (wordsDiv) {
            wordsDiv.textContent = '';
        }
        formData.loanAmount = 0;
    }
}


function formatAmountInWords(amount) {
    // Validate input
    if (isNaN(amount) || !isFinite(amount) || amount < 0) {
        return "Zero Rupees Only";
    }
    
    amount = Math.floor(amount); // Convert to integer
    
    const units = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
    const teens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

    if (amount === 0) return "Zero Rupees Only";

    let word = "";
    let crore = Math.floor(amount / 10000000);
    amount %= 10000000;
    if (crore > 0) {
        if (crore < 10) {
            word += units[crore] + " Crore ";
        } else if (crore < 20) {
            word += teens[crore - 10] + " Crore ";
        } else {
            word += tens[Math.floor(crore / 10)] + " " + units[crore % 10] + " Crore ";
        }
    }

    let lakh = Math.floor(amount / 100000);
    amount %= 100000;
    if (lakh > 0) {
        if (lakh < 10) {
            word += units[lakh] + " Lakh ";
        } else if (lakh < 20) {
            word += teens[lakh - 10] + " Lakh ";
        } else {
            word += tens[Math.floor(lakh / 10)] + " " + units[lakh % 10] + " Lakh ";
        }
    }

    let thousand = Math.floor(amount / 1000);
    amount %= 1000;
    if (thousand > 0) {
        if (thousand < 10) {
            word += units[thousand] + " Thousand ";
        } else if (thousand < 20) {
            word += teens[thousand - 10] + " Thousand ";
        } else {
            word += tens[Math.floor(thousand / 10)] + " " + units[thousand % 10] + " Thousand ";
        }
    }

    if (amount > 0) {
        if (amount < 10) {
            word += units[amount] + " ";
        } else if (amount < 20) {
            word += teens[amount - 10] + " ";
        } else {
            word += tens[Math.floor(amount / 10)] + " " + units[amount % 10] + " ";
        }
    }

    return word.trim() + " Rupees Only";
}

// Export functions for global access
window.nextStep = nextStep;
window.prevStep = prevStep;
window.startApplication = startApplication;
window.showLoanSelection = showLoanSelection;
window.showDocumentUpload = showDocumentUpload;
window.showFinalApproval = showFinalApproval;
window.resetApplication = resetApplication;
window.simulateSteps = simulateSteps;
window.showThankYou = showThankYou;
window.restartApplication = restartApplication;
window.downloadSummary = downloadSummary;
window.acceptLoan = acceptLoan;
window.downloadLoanSummary = downloadLoanSummary;
window.hideNotification = hideNotification;

window.showDocumentPreview = showDocumentPreview;
window.closeDocumentPreview = closeDocumentPreview;
window.downloadDocument = downloadDocument;
window.openDocumentPreview = openDocumentPreview;
window.handleDocumentUpload = handleDocumentUpload;
window.showOTPModal = showOTPModal;
window.closeOTPModal = closeOTPModal;
window.resendOTP = resendOTP;
window.verifyOTP = verifyOTP;
window.moveToNext = moveToNext;
window.handleBackspace = handleBackspace;
window.showTJSBConsentModal = showTJSBConsentModal;
window.closeTJSBConsentModal = closeTJSBConsentModal;
window.agreeTJSBConsent = agreeTJSBConsent;
window.updateOVDFields = updateOVDFields;
window.moveToNextAadhar = moveToNextAadhar;
window.toggleAadharVisibility = toggleAadharVisibility;
window.formatLoanAmountDisplay = formatLoanAmountDisplay;
window.formatBusinessLoanAmountDisplay = formatBusinessLoanAmountDisplay;
window.handleTJSBConsentClick = handleTJSBConsentClick;
window.verifyOVDNumber = verifyOVDNumber;
window.showOVDOTPModal = showOVDOTPModal;
window.closeOVDOTPModal = closeOVDOTPModal;
window.resendOVDOTP = resendOVDOTP;
window.verifyOVDOTP = verifyOVDOTP;
window.moveToNextOVD = moveToNextOVD;
window.handleOVDBackspace = handleOVDBackspace;
window.getOVDDisplayName = getOVDDisplayName;
window.showTJSBPersonalConsentModal = showTJSBPersonalConsentModal;
window.closeTJSBPersonalConsentModal = closeTJSBPersonalConsentModal;
window.agreeTJSBPersonalConsent = agreeTJSBPersonalConsent;
window.handleTJSBPersonalConsentClick = handleTJSBPersonalConsentClick;
