import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// Supabase configuration
const supabaseUrl = 'https://opjyksksnccurdwyskiu.supabase.co'
const supabaseKey = 'sb_publishable_l7mKNQVJ6WesiTM4GJCxQg_oXxTN3it'
const supabase = createClient(supabaseUrl, supabaseKey)

// AI Analysis State
let isAnalyzing = false;
let currentAnalysis = null;
let mobilenetModel = null;

// ========== ADDED: Store uploaded image data ==========
let uploadedImageData = null;

// Function to get current logged-in student
function getCurrentStudent() {
    const stored = localStorage.getItem('currentStudent');
    if (stored) {
        const student = JSON.parse(stored);
        return {
            id: student.id || student.studentId || 'student_001',
            name: student.name || document.getElementById('studentName')?.value || 'Student',
            // FIXED: Use studentId consistently
            studentId: student.studentId || student.id || student.idNumber || '2024-00001',
            email: student.email || 'student@campus.edu'
        };
    }
    return {
        id: 'student_001',
        name: document.getElementById('studentName')?.value || 'Student',
        studentId: '2024-00001',
        email: 'student@campus.edu'
    };
}

// NEW: Prefill student name from localStorage
function prefillStudentName() {
    const studentNameInput = document.getElementById('studentName');
    if (!studentNameInput) return;
    
    const stored = localStorage.getItem('currentStudent');
    if (stored) {
        try {
            const student = JSON.parse(stored);
            if (student.name) {
                studentNameInput.value = student.name;
                // Store original name for anonymous toggle restore
                studentNameInput.setAttribute('data-original-name', student.name);
            }
        } catch(e) {
            console.error('Error parsing student data:', e);
        }
    }
}

// Category mapping with keywords for MobileNet detection
const categoryMapping = {
    'security': { 
        name: 'Security Alert', 
        color: '#DC2626',
        bgColor: '#FEF2F2',
        weight: 1.5,
        keywords: ['knife', 'weapon', 'gun', 'danger', 'threat', 'intruder', 'violence', 'attack', 
                'fight', 'assault', 'suspicious', 'trespassing', 'theft', 'robbery', 'vandalism',
                'harassment', 'emergency', 'fire', 'smoke', 'alarm', 'security', 'police', 'blood',
                'injury', 'accident', 'broken glass', 'window broken']
    },
    'maintenance': { 
        name: 'Maintenance', 
        color: '#2563EB',
        bgColor: '#EFF6FF',
        weight: 1.0,
        keywords: ['broken', 'wire', 'sparking', 'light', 'electrical', 'pipe', 'leak', 'ac', 'cracked',
                'flickering', 'outlet', 'plumbing', 'flood', 'water', 'heater', 'ventilation',
                'circuit', 'breaker', 'switch', 'socket', 'cable']
    },
    'janitorial': { 
        name: 'Janitorial', 
        color: '#085041',
        bgColor: '#E1F5EE',
        weight: 1.0,
        keywords: ['trash', 'dirty', 'toilet', 'spill', 'garbage', 'overflow', 'mess', 'odor', 'bathroom',
                'clean', 'dust', 'mold', 'restroom', 'clogged', 'sink', 'urinal', 'waste',
                'litter', 'debris', 'stain', 'floor wet']
    },
    'facilities': { 
        name: 'Facilities', 
        color: '#D97706',
        bgColor: '#FFFBEB',
        weight: 1.0,
        keywords: ['elevator', 'door', 'window', 'ceiling', 'floor', 'wall', 'paint', 'furniture',
                'chair', 'table', 'desk', 'stair', 'railing', 'lighting', 'exit', 'signage',
                'handle', 'lock', 'hinge', 'carpet', 'tile']
    }
};

// Load MobileNet model
async function loadMobileNet() {
    if (mobilenetModel) return mobilenetModel;
    try {
        if (typeof tf === 'undefined') {
            console.log('Loading TensorFlow.js...');
            await new Promise((resolve) => {
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.15.0/dist/tf.min.js';
                script.onload = resolve;
                document.head.appendChild(script);
            });
        }
        
        if (typeof mobilenet === 'undefined') {
            console.log('Loading MobileNet model...');
            await new Promise((resolve) => {
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet@2.1.1/dist/mobilenet.min.js';
                script.onload = resolve;
                document.head.appendChild(script);
            });
        }
        
        mobilenetModel = await mobilenet.load();
        console.log('MobileNet model loaded successfully!');
        return mobilenetModel;
    } catch (error) {
        console.error('Failed to load MobileNet:', error);
        return null;
    }
}

// Analyze image with MobileNet
async function analyzeImageWithMobileNet(imageElement) {
    if (!mobilenetModel) return null;
    try {
        const predictions = await mobilenetModel.classify(imageElement);
        console.log('MobileNet predictions:', predictions);
        return predictions;
    } catch (error) {
        console.error('MobileNet classification error:', error);
        return null;
    }
}

// Enhanced image analysis combining MobileNet and color analysis
async function analyzeImageWithAI(imageFile) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        
        reader.onload = async function(e) {
            const img = new Image();
            img.src = e.target.result;
            
            img.onload = async function() {
                let detectedCategory = 'maintenance';
                let highestConfidence = 0.3;
                let matchedKeywords = [];
                
                // Try MobileNet analysis first
                if (mobilenetModel) {
                    try {
                        const predictions = await analyzeImageWithMobileNet(img);
                        if (predictions && predictions.length > 0) {
                            for (const pred of predictions) {
                                const className = pred.className.toLowerCase();
                                const confidence = pred.probability;
                                
                                for (const [category, data] of Object.entries(categoryMapping)) {
                                    for (const keyword of data.keywords) {
                                        if (className.includes(keyword)) {
                                            let categoryConfidence = confidence * 0.8;
                                            if (categoryConfidence > highestConfidence) {
                                                highestConfidence = categoryConfidence;
                                                detectedCategory = category;
                                                matchedKeywords.push(`MobileNet: ${keyword}`);
                                            }
                                        }
                                    }
                                }
                                
                                // Special security detection for dangerous objects
                                const securityKeywords = ['knife', 'weapon', 'gun', 'scissors', 'blade'];
                                for (const secKeyword of securityKeywords) {
                                    if (className.includes(secKeyword)) {
                                        detectedCategory = 'security';
                                        highestConfidence = Math.max(highestConfidence, 0.85);
                                        matchedKeywords.push(`Detected: ${secKeyword}`);
                                    }
                                }
                            }
                        }
                    } catch (err) {
                        console.error('MobileNet analysis error:', err);
                    }
                }
                
                // Color analysis as backup
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;
                
                let redPixels = 0;
                let darkPixels = 0;
                let totalPixels = canvas.width * canvas.height;
                
                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i], g = data[i + 1], b = data[i + 2];
                    if (r > 200 && g < 100 && b < 100) redPixels++;
                    if ((r + g + b) / 3 < 50) darkPixels++;
                }
                
                const redRatio = redPixels / totalPixels;
                const darkRatio = darkPixels / totalPixels;
                
                if (redRatio > 0.03 && detectedCategory !== 'security') {
                    const colorConfidence = Math.min(0.7 + (redRatio * 3), 0.9);
                    if (colorConfidence > highestConfidence) {
                        detectedCategory = 'security';
                        highestConfidence = colorConfidence;
                        matchedKeywords.push('red_detected_emergency');
                    }
                }
                
                if (darkRatio > 0.5 && detectedCategory === 'maintenance' && highestConfidence < 0.5) {
                    highestConfidence = 0.55;
                    matchedKeywords.push('dark_area_maintenance');
                }
                
                if (highestConfidence < 0.4) {
                    let avgBrightness = 0;
                    for (let i = 0; i < data.length; i += 4) {
                        avgBrightness += (data[i] + data[i+1] + data[i+2]) / 3;
                    }
                    avgBrightness /= totalPixels;
                    
                    if (avgBrightness < 80) {
                        detectedCategory = 'maintenance';
                        highestConfidence = 0.45;
                        matchedKeywords.push('low_light_condition');
                    }
                }
                
                highestConfidence = Math.min(highestConfidence, 0.95);
                
                console.log(`AI Detection Result - Category: ${detectedCategory}, Confidence: ${highestConfidence}`);
                
                resolve({
                    predicted_type: detectedCategory,
                    confidence: highestConfidence,
                    matchedKeywords: matchedKeywords
                });
            };
        };
        
        reader.onerror = () => {
            resolve({
                predicted_type: 'maintenance',
                confidence: 0.3,
                matchedKeywords: []
            });
        };
        
        reader.readAsDataURL(imageFile);
    });
}

// Analyze priority level
async function analyzePriorityLevel(imageFile, category) {
    return new Promise((resolve) => {
        const img = new Image();
        const reader = new FileReader();
        
        reader.onload = function(e) {
            img.src = e.target.result;
            img.onload = function() {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;
                
                let urgencyScore = 0;
                let redIntensity = 0;
                let darkIntensity = 0;
                
                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i], g = data[i + 1], b = data[i + 2];
                    if (r > 200 && g < 100 && b < 100) redIntensity++;
                    const brightness = (r + g + b) / 3;
                    if (brightness < 40) darkIntensity++;
                }
                
                const pixelCount = canvas.width * canvas.height;
                redIntensity = redIntensity / pixelCount;
                darkIntensity = darkIntensity / pixelCount;
                
                if (category === 'security') {
                    urgencyScore = 0.85;
                    if (redIntensity > 0.02) urgencyScore = 0.95;
                } else if (category === 'maintenance') {
                    urgencyScore = 0.5;
                    if (darkIntensity > 0.3) urgencyScore = 0.7;
                } else if (category === 'janitorial') {
                    urgencyScore = 0.35;
                    if (darkIntensity > 0.25) urgencyScore = 0.55;
                } else {
                    urgencyScore = 0.45;
                }
                
                let priority = 'medium';
                let priorityConfidence = 0.6;
                
                if (urgencyScore > 0.75) {
                    priority = 'high';
                    priorityConfidence = Math.min(0.7 + (urgencyScore * 0.25), 0.95);
                } else if (urgencyScore > 0.45) {
                    priority = 'medium';
                    priorityConfidence = 0.65;
                } else {
                    priority = 'low';
                    priorityConfidence = 0.6;
                }
                
                resolve({ priority: priority, confidence: priorityConfidence });
            };
        };
        reader.onerror = () => resolve({ priority: 'medium', confidence: 0.5 });
        reader.readAsDataURL(imageFile);
    });
}

// Apply AI category
function applyAICategory(category) {
    const categoryItems = document.querySelectorAll('.cat-item');
    const categoryInput = document.getElementById('category');
    
    categoryItems.forEach((item) => {
        const itemCategory = item.getAttribute('data-cat');
        if (itemCategory === category) {
            item.classList.add('active');
            if (categoryInput) categoryInput.value = category;
        } else {
            item.classList.remove('active');
        }
    });
}

// Apply AI priority
function applyAIPriority(priority) {
    const priorityButtons = document.querySelectorAll('.p-btn');
    const priorityInput = document.getElementById('priority');
    
    priorityButtons.forEach((btn) => {
        const btnPriority = btn.getAttribute('data-priority');
        if (btnPriority === priority) {
            btn.classList.add('active');
            if (priorityInput) priorityInput.value = priority;
        } else {
            btn.classList.remove('active');
        }
    });
}

// Show AI suggestion
function showAISuggestion(category, confidence, matchedKeywords = [], priority = null, priorityConfidence = null) {
    const indicator = document.getElementById('aiAnalysisIndicator');
    if (!indicator) return;
    
    const categoryInfo = categoryMapping[category];
    if (!categoryInfo) {
        indicator.style.display = 'none';
        return;
    }
    
    const confidencePercent = Math.round(confidence * 100);
    
    let priorityBadge = '';
    if (priority) {
        switch(priority) {
            case 'high':
                priorityBadge = `<span style="background: #FEF2F2; color: #DC2626; padding: 4px 12px; border-radius: 20px; font-weight: 500; font-size: 12px;">🔴 High Priority</span>`;
                break;
            case 'medium':
                priorityBadge = `<span style="background: #FFFBEB; color: #D97706; padding: 4px 12px; border-radius: 20px; font-weight: 500; font-size: 12px;">🟠 Medium Priority</span>`;
                break;
            case 'low':
                priorityBadge = `<span style="background: #E1F5EE; color: #1D9E75; padding: 4px 12px; border-radius: 20px; font-weight: 500; font-size: 12px;">🟢 Low Priority</span>`;
                break;
        }
    }
    
    let keywordText = '';
    if (matchedKeywords && matchedKeywords.length > 0) {
        keywordText = `<div style="font-size: 11px; color: #6B7280; margin-top: 6px;">🔍 Detected: ${matchedKeywords.slice(0, 3).join(', ')}</div>`;
    }
    
    indicator.className = 'ai-indicator success';
    indicator.style.display = 'block';
    
    indicator.innerHTML = `
        <div class="ai-suggestion-content">
            <div style="flex: 1;">
                <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                    <span style="font-size: 20px;">🤖</span>
                    <span style="font-weight: 500;">AI detected:</span>
                    <span class="ai-category-badge" style="background: ${categoryInfo.bgColor}; color: ${categoryInfo.color};">
                        ${categoryInfo.name}
                    </span>
                    <span style="color: #6B7280;">(${confidencePercent}% confidence)</span>
                    ${priorityBadge}
                </div>
                ${keywordText}
            </div>
            <div class="ai-buttons">
                <button type="button" class="ai-accept-btn" id="acceptAISuggestion">✓ Accept All</button>
                <button type="button" class="ai-dismiss-btn" id="dismissAISuggestion">✗ Dismiss</button>
            </div>
        </div>
    `;
    
    currentAnalysis = { category, confidence, priority, priorityConfidence, matchedKeywords };
    
    const acceptBtn = document.getElementById('acceptAISuggestion');
    const dismissBtn = document.getElementById('dismissAISuggestion');
    
    if (acceptBtn) {
        acceptBtn.onclick = () => {
            applyAICategory(category);
            if (priority) applyAIPriority(priority);
            indicator.style.display = 'none';
            let message = `✅ Category set to ${categoryInfo.name}`;
            if (priority) message += ` with ${priority.toUpperCase()} priority`;
            showNotification(message, 'success');
        };
    }
    
    if (dismissBtn) {
        dismissBtn.onclick = () => {
            indicator.style.display = 'none';
            showNotification('AI suggestion dismissed', 'info');
        };
    }
}

// Setup anonymous reporting toggle (MODIFIED: clears name field when checked)
function setupAnonymousToggle() {
    const anonymousToggle = document.getElementById('anonymousToggle');
    const studentNameInput = document.getElementById('studentName');
    const anonymousWarning = document.getElementById('anonymousWarning');
    const anonymousInfo = document.getElementById('anonymousInfo');
    
    if (!anonymousToggle) return;
    
    anonymousToggle.addEventListener('change', function(e) {
        if (this.checked) {
            // Store the original name if not already stored
            if (!studentNameInput.getAttribute('data-original-name') && studentNameInput.value) {
                studentNameInput.setAttribute('data-original-name', studentNameInput.value);
            }
            // Clear the name field (vanish)
            studentNameInput.value = '';
            studentNameInput.disabled = true;
            studentNameInput.style.backgroundColor = '#F3F4F6';
            studentNameInput.style.color = '#6B7280';
            studentNameInput.style.cursor = 'not-allowed';
            
            if (anonymousWarning) anonymousWarning.style.display = 'block';
            if (anonymousInfo) anonymousInfo.style.display = 'block';
            
            showNotification('🔒 Anonymous mode activated. Your name will not appear.', 'info');
        } else {
            // Restore original name
            const originalName = studentNameInput.getAttribute('data-original-name');
            studentNameInput.value = originalName || '';
            studentNameInput.disabled = false;
            studentNameInput.style.backgroundColor = '';
            studentNameInput.style.color = '';
            studentNameInput.style.cursor = '';
            
            if (anonymousWarning) anonymousWarning.style.display = 'none';
            if (anonymousInfo) anonymousInfo.style.display = 'none';
            
            showNotification('Anonymous mode disabled. Your name will be visible.', 'info');
        }
    });
}

// Upload image to Supabase
async function uploadImage(file, studentId) {
    if (!file) return null;
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${studentId}_${Date.now()}.${fileExt}`;
    const filePath = `incidents/${fileName}`;
    
    try {
        const { data, error } = await supabase.storage
            .from('incident-images')
            .upload(filePath, file);
        
        if (error) {
            console.error('Upload error:', error);
            return null;
        }
        
        const { data: { publicUrl } } = supabase.storage
            .from('incident-images')
            .getPublicUrl(filePath);
        
        return publicUrl;
    } catch (error) {
        console.error('Image upload failed:', error);
        return null;
    }
}

// ========== FIXED: Setup image upload with base64 storage ==========
function setupImageUpload() {
    const imageInput = document.getElementById('image');
    const uploadZone = document.getElementById('uploadZone');
    const uploadContent = document.getElementById('uploadContent');
    const previewContainer = document.getElementById('imagePreviewContainer');
    const previewImg = document.getElementById('previewImg');
    const removeBtn = document.getElementById('removeImageBtn');
    
    if (!uploadZone) return;
    
    uploadZone.addEventListener('click', (e) => {
        if (e.target !== removeBtn && !removeBtn?.contains(e.target)) {
            imageInput.click();
        }
    });
    
    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.style.borderColor = '#1D9E75';
        uploadZone.style.background = '#F0FDF4';
    });
    
    uploadZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        uploadZone.style.borderColor = '#D1D5DB';
        uploadZone.style.background = '#F9FAFB';
    });
    
    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.style.borderColor = '#D1D5DB';
        uploadZone.style.background = '#F9FAFB';
        
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            handleImageFile(file);
        }
    });
    
    if (removeBtn) {
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            imageInput.value = '';
            uploadedImageData = null;  // Clear stored image
            previewContainer.style.display = 'none';
            uploadContent.style.display = 'block';
            
            const indicator = document.getElementById('aiAnalysisIndicator');
            if (indicator) indicator.style.display = 'none';
            currentAnalysis = null;
        });
    }
    
    imageInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            handleImageFile(file);
        }
    });
    
    // ========== FIXED: Store image as base64 ==========
    function handleImageFile(file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            // Store base64 image data
            uploadedImageData = event.target.result;
            previewImg.src = uploadedImageData;
            uploadContent.style.display = 'none';
            previewContainer.style.display = 'flex';
            console.log('Image loaded and stored as base64, length:', uploadedImageData.length);
        };
        reader.readAsDataURL(file);
        
        // AI Analysis (keep existing functionality)
        const indicator = document.getElementById('aiAnalysisIndicator');
        if (indicator) {
            indicator.className = 'ai-indicator processing';
            indicator.style.display = 'block';
            indicator.innerHTML = `<div style="display: flex; align-items: center; gap: 12px;"><div class="spinner-small"></div><span>🤖 AI is analyzing the image...</span></div>`;
        }
        
        (async () => {
            try {
                await loadMobileNet();
                
                const aiResult = await analyzeImageWithAI(file);
                
                if (aiResult && aiResult.predicted_type && aiResult.confidence > 0.35) {
                    const category = aiResult.predicted_type;
                    const confidence = aiResult.confidence;
                    const matchedKeywords = aiResult.matchedKeywords || [];
                    
                    const priorityResult = await analyzePriorityLevel(file, category);
                    const priority = priorityResult.priority;
                    const priorityConfidence = priorityResult.confidence;
                    
                    showAISuggestion(category, confidence, matchedKeywords, priority, priorityConfidence);
                    
                    if (confidence > 0.65) {
                        setTimeout(() => {
                            applyAICategory(category);
                            applyAIPriority(priority);
                        }, 500);
                    }
                } else {
                    if (indicator) {
                        indicator.className = 'ai-indicator error';
                        indicator.innerHTML = `<div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
                            <span>⚠️ AI couldn't determine the category. Please select manually.</span>
                            <button type="button" id="dismissAIError" style="background: none; border: none; cursor: pointer; color: #DC2626;">✗ Dismiss</button>
                        </div>`;
                        const dismissError = document.getElementById('dismissAIError');
                        if (dismissError) {
                            dismissError.onclick = () => { indicator.style.display = 'none'; };
                        }
                    }
                }
            } catch (error) {
                console.error('AI analysis error:', error);
                if (indicator) {
                    indicator.className = 'ai-indicator error';
                    indicator.innerHTML = `<div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
                        <span>⚠️ AI analysis failed. Please select category manually.</span>
                        <button type="button" id="dismissAIError" style="background: none; border: none; cursor: pointer; color: #DC2626;">✗ Dismiss</button>
                    </div>`;
                    const dismissError = document.getElementById('dismissAIError');
                    if (dismissError) {
                        dismissError.onclick = () => { indicator.style.display = 'none'; };
                    }
                }
            }
        })();
    }
}

// Category selection
window.selCat = function(element) {
    const allItems = document.querySelectorAll('.cat-item');
    allItems.forEach(item => item.classList.remove('active'));
    element.classList.add('active');
    
    const category = element.getAttribute('data-cat');
    const categoryInput = document.getElementById('category');
    if (categoryInput) categoryInput.value = category;
};

// Priority selection
window.selPriority = function(element) {
    const allButtons = document.querySelectorAll('.p-btn');
    allButtons.forEach(btn => btn.classList.remove('active'));
    element.classList.add('active');
    
    const priorityInput = document.getElementById('priority');
    if (priorityInput) {
        priorityInput.value = element.getAttribute('data-priority');
    }
};

// Go back
window.goBack = function() {
    window.location.href = '/Assets/Student_dashboard/SDB.html';
}

// Scroll to error
function scrollToError(element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    element.classList.add('error');
    setTimeout(() => element.classList.remove('error'), 3000);
}

// Show error message
function showErrorMessage(message, elementId) {
    let errorDiv = document.getElementById(elementId);
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.id = elementId;
        errorDiv.className = 'error-message';
        const parent = document.getElementById(elementId.replace('Error', ''))?.parentNode;
        if (parent) parent.appendChild(errorDiv);
    }
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    setTimeout(() => errorDiv.style.display = 'none', 5000);
}

// Set loading state
function setLoading(isLoading) {
    const submitBtn = document.getElementById('submitBtn');
    const btnText = document.getElementById('btnText');
    const btnLoader = document.getElementById('btnLoader');
    
    if (submitBtn) {
        submitBtn.disabled = isLoading;
        if (btnText) btnText.style.display = isLoading ? 'none' : 'inline';
        if (btnLoader) btnLoader.style.display = isLoading ? 'inline-block' : 'none';
    }
}

// Show notification
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 12px 20px;
        background: ${type === 'success' ? '#1D9E75' : type === 'warning' ? '#D97706' : type === 'info' ? '#3B82F6' : '#DC2626'};
        color: white;
        border-radius: 12px;
        font-size: 13px;
        font-weight: 500;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Load TensorFlow and MobileNet on page load
async function initializeAI() {
    console.log('Initializing AI models...');
    await loadMobileNet();
    console.log('AI initialization complete!');
}

// ========== FIXED: Form submission with base64 image ==========
document.addEventListener('DOMContentLoaded', async () => {
    const reportForm = document.getElementById('reportForm');
    const categoryInput = document.getElementById('category');
    const priorityInput = document.getElementById('priority');
    
    // NEW: Prefill student name from localStorage
    prefillStudentName();
    
    await initializeAI();
    setupImageUpload();
    setupAnonymousToggle();
    
    if (reportForm) {
        reportForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const title = document.getElementById('title')?.value.trim();
            const location = document.getElementById('location')?.value.trim();
            const category = categoryInput?.value;
            const priority = priorityInput?.value;
            const description = document.getElementById('description')?.value.trim();
            let studentName = document.getElementById('studentName')?.value.trim();
            
            // Check if anonymous mode is enabled
            const anonymousToggle = document.getElementById('anonymousToggle');
            const isAnonymous = anonymousToggle ? anonymousToggle.checked : false;
            
            // If anonymous mode is on, clear name
            if (isAnonymous) {
                studentName = '';
            }
            
            // Validation
            if (!title) { showErrorMessage('Please enter a title', 'titleError'); scrollToError(document.getElementById('title')); return; }
            if (!location) { showErrorMessage('Please enter a location', 'locationError'); scrollToError(document.getElementById('location')); return; }
            if (!category) { showErrorMessage('Please select a category', 'categoryError'); scrollToError(document.querySelector('.cat-grid')); return; }
            if (!priority) { showErrorMessage('Please select a priority level', 'priorityError'); scrollToError(document.querySelector('.priority-row')); return; }
            if (!description) { showErrorMessage('Please provide a description', 'descriptionError'); scrollToError(document.getElementById('description')); return; }
            
            setLoading(true);
            
            try {
                const currentStudent = getCurrentStudent();
                
                // ========== FIXED: Use stored base64 image data ==========
                let imageUrl = uploadedImageData || null;
                console.log('Image saved:', imageUrl ? `YES (length: ${imageUrl.length})` : 'NO');
                
                // If anonymous and studentName is empty, set to 'Anonymous Reporter'
                const finalStudentName = (isAnonymous && !studentName) ? 'Anonymous Reporter' : (studentName || currentStudent.name);
                
                // Create report object for localStorage (with base64 image)
                // FIXED: Use studentId consistently
                const localReport = {
                    id: Date.now(),
                    title: title,
                    location: location,
                    category: category,
                    priority: priority,
                    description: description,
                    imageUrl: imageUrl,  // Base64 image
                    studentName: finalStudentName,
                    studentId: currentStudent.studentId,  // FIXED: Changed from studentIdNumber to studentId
                    status: 'pending',
                    timestamp: new Date().toISOString()
                };
                
                console.log('Submitting report:', localReport);
                console.log('Student ID being saved:', currentStudent.studentId);
                
                // Save to localStorage first
                const existingReports = JSON.parse(localStorage.getItem('campus_care_reports') || '[]');
                existingReports.unshift(localReport);
                localStorage.setItem('campus_care_reports', JSON.stringify(existingReports));
                
                // Also try to save to Supabase (optional, don't fail if it errors)
                try {
                    const supabaseData = {
                        title: title,
                        location: location,
                        category: category,
                        priority: priority,
                        description: description,
                        image_url: imageUrl,
                        student_name: finalStudentName,
                        student_id_number: currentStudent.studentId,  // FIXED: Use studentId
                        status: 'pending',
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    };
                    
                    const { error } = await supabase
                        .from('incident')
                        .insert([supabaseData]);
                    
                    if (error) console.error('Supabase error (non-critical):', error);
                } catch (supabaseError) {
                    console.log('Supabase save skipped:', supabaseError.message);
                }
                
                const successMessage = isAnonymous ? 
                    '✅ Report submitted anonymously! Your identity is protected.' : 
                    '✅ Report submitted successfully!';
                showNotification(successMessage, 'success');
                
                setTimeout(() => {
                    window.location.href = '/Assets/Student_dashboard/SDB.html';
                }, 2000);
                
            } catch (error) {
                console.error('Submission error:', error);
                showNotification('❌ Failed: ' + error.message, 'error');
            } finally {
                setLoading(false);
            }
        });
    }
});

// CSS animations
if (!document.querySelector('style[data-report-animations]')) {
    const style = document.createElement('style');
    style.setAttribute('data-report-animations', 'true');
    style.textContent = `
        @keyframes slideIn { from { transform: translateX(400px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(400px); opacity: 0; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        
        .spinner-small { width: 18px; height: 18px; border: 2px solid #1D9E75; border-top-color: transparent; border-radius: 50%; animation: spin 0.8s linear infinite; display: inline-block; }
        .error { border: 2px solid #DC2626 !important; background-color: #FEF2F2 !important; }
        .error-message { animation: fadeIn 0.3s ease; }
        
        .ai-indicator { margin-top: 12px; padding: 12px 16px; border-radius: 12px; font-size: 13px; animation: fadeIn 0.3s ease; }
        .ai-indicator.processing { background: #EFF6FF; border-left: 3px solid #3B82F6; }
        .ai-indicator.success { background: #E8F5E9; border-left: 3px solid #1D9E75; }
        .ai-indicator.error { background: #FEF2F2; border-left: 3px solid #DC2626; }
        
        .ai-suggestion-content { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
        .ai-category-badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; border-radius: 20px; font-weight: 500; font-size: 12px; }
        .ai-buttons { display: flex; gap: 8px; }
        .ai-accept-btn { background: #1D9E75; color: white; border: none; padding: 5px 15px; border-radius: 20px; cursor: pointer; font-size: 12px; font-weight: 500; }
        .ai-accept-btn:hover { background: #085041; }
        .ai-dismiss-btn { background: #E5E7EB; color: #4B5563; border: none; padding: 5px 15px; border-radius: 20px; cursor: pointer; font-size: 12px; }
        .ai-dismiss-btn:hover { background: #D1D5DB; }
        
        .anonymous-switch { display: flex; align-items: center; gap: 12px; padding: 8px 0; border-radius: 12px; transition: background 0.2s ease; cursor: pointer; }
        .anonymous-switch:hover { background: rgba(0,0,0,0.02); }
        .anonymous-switch input { width: 18px; height: 18px; cursor: pointer; accent-color: #1D9E75; }
        
        #studentName:disabled { background-color: #F3F4F6; color: #6B7280; cursor: not-allowed; border-color: #E5E7EB; }
        
        #anonymousWarning, #anonymousInfo { animation: slideDown 0.3s ease; }
        #anonymousWarning { background: #FEF3C7; border-left: 3px solid #D97706; padding: 8px 12px; border-radius: 8px; font-size: 12px; color: #92400E; margin-top: 8px; }
        #anonymousInfo { background: #E8F5E9; border-left: 3px solid #1D9E75; padding: 8px 12px; border-radius: 8px; font-size: 12px; color: #085041; margin-top: 8px; }
    `;
    document.head.appendChild(style);
}