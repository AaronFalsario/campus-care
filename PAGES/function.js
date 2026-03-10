

document.addEventListener("DOMContentLoaded", function () {
    const nav = document.querySelector("header nav");
    const navList = document.querySelector("header nav ul");

    const hamburger = document.createElement("button");
    hamburger.className = "hamburger";
    hamburger.setAttribute("aria-label", "Toggle navigation");
    hamburger.innerHTML = `<span></span><span></span><span></span>`;

    nav.insertBefore(hamburger, navList);

    hamburger.addEventListener("click", function () {
        navList.classList.toggle("nav-open");
        hamburger.classList.toggle("open");
    });
    navList.querySelectorAll("a").forEach(link => {
        link.addEventListener("click", () => {
            navList.classList.remove("nav-open");
            hamburger.classList.remove("open");
        });
    });
});

document.addEventListener('DOMContentLoaded', () => {
  const elementsToAnimate = document.querySelectorAll('.hidden');

  const showElements = () => {
    elementsToAnimate.forEach((element, index) => {
 
      setTimeout(() => {
        element.classList.add('show');
      }, index * 100);
    });
  };

  showElements();
});

const checkinInput = document.getElementById('checkin');
        const checkoutInput = document.getElementById('checkout');
        const calendarModal = document.getElementById('calendar-modal');
        const modalCloseBtn = document.querySelector('.modal-close');
        const modalTitle = document.getElementById('modal-title');
        const dayStep = document.getElementById('day-step');
        const monthStep = document.getElementById('month-step');
        const yearStep = document.getElementById('year-step');
        const dayGrid = document.getElementById('day-grid');
        const monthGrid = document.getElementById('month-grid');
        const yearInput = document.getElementById('year-input');
        const setYearBtn = document.getElementById('set-year-btn');
        
        let selectedDate = {
            day: null,
            month: null,
            year: null
        };
        let currentInput = null;

        const monthNames = [
            "Jan", "Feb", "Mar", "Apr", "May", "Jun",
            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
        ];
        
        // Utility function to show a step
        const showStep = (stepElement) => {
            [dayStep, monthStep, yearStep].forEach(el => {
                el.classList.add('hidden-step');
            });
            stepElement.classList.remove('hidden-step');
        };

        // Render the day grid
        const renderDays = (month, year) => {
            dayGrid.innerHTML = '';
            const daysInMonth = new Date(year, month, 0).getDate();
            for (let i = 1; i <= 31; i++) {
                const dayButton = document.createElement('button');
                dayButton.textContent = i;
                dayButton.classList.add('grid-button');
                dayButton.dataset.day = i;
                if (i > daysInMonth) {
                    dayButton.classList.add('disabled');
                }
                dayGrid.appendChild(dayButton);
            }
        };

        // Open modal and set active input
        checkinInput.addEventListener('click', () => {
            currentInput = checkinInput;
            checkinInput.classList.add('active');
            checkoutInput.classList.remove('active');
            modalTitle.textContent = 'Select Check-in Date';
            calendarModal.style.display = 'flex';
            showStep(dayStep);
            renderDays(new Date().getMonth() + 1, new Date().getFullYear());
        });

        checkoutInput.addEventListener('click', () => {
            currentInput = checkoutInput;
            checkoutInput.classList.add('active');
            checkinInput.classList.remove('active');
            modalTitle.textContent = 'Select Check-out Date';
            calendarModal.style.display = 'flex';
            showStep(dayStep);
            renderDays(new Date().getMonth() + 1, new Date().getFullYear());
        });

        // Close modal
        modalCloseBtn.addEventListener('click', () => {
            calendarModal.style.display = 'none';
            currentInput.classList.remove('active');
            currentInput = null;
        });

        // Event listener for day selection
        dayGrid.addEventListener('click', (e) => {
            const button = e.target.closest('.grid-button');
            if (button && !button.classList.contains('disabled')) {
                selectedDate.day = parseInt(button.dataset.day);
                document.querySelectorAll('#day-grid .selected').forEach(btn => btn.classList.remove('selected'));
                button.classList.add('selected');
                modalTitle.textContent = `Month for Day ${selectedDate.day}`;
                showStep(monthStep);
            }
        });

        // Event listener for month selection
        monthGrid.addEventListener('click', (e) => {
            const button = e.target.closest('.month-button');
            if (button) {
                selectedDate.month = parseInt(button.dataset.month);
                
                const daysInMonth = new Date(2024, selectedDate.month, 0).getDate();
                if (selectedDate.day > daysInMonth) {
                    selectedDate.day = null;
                    alert('The selected day is not valid for this month. Please select a new day.');
                    showStep(dayStep);
                    return;
                }

                document.querySelectorAll('#month-grid .selected').forEach(btn => btn.classList.remove('selected'));
                button.classList.add('selected');
                modalTitle.textContent = `Year for ${monthNames[selectedDate.month - 1]} ${selectedDate.day}`;
                showStep(yearStep);
            }
        });
        setYearBtn.addEventListener('click', () => {
            const year = parseInt(yearInput.value);
            if (year && currentInput) {
                selectedDate.year = year;
                currentInput.value = `${selectedDate.day}/${selectedDate.month}/${selectedDate.year.toString().slice(-2)}`;
                
          
                calendarModal.style.display = 'none';
                currentInput.classList.remove('active');
                currentInput = null;

            } else {
                 alert('Please enter a valid year.');
            }
        });


        function alert(message) {
            const existingModal = document.querySelector('.alert-modal');
            if (existingModal) existingModal.remove();

            const modal = document.createElement('div');
            modal.classList.add('alert-modal', 'fixed', 'inset-0', 'bg-gray-900', 'bg-opacity-50', 'flex', 'items-center', 'justify-center', 'p-4', 'z-50');
            modal.innerHTML = `
                <div class="bg-white p-8 rounded-xl shadow-2xl max-w-sm w-full text-center">
                    <h3 class="text-xl font-semibold text-gray-800 mb-4">Notice</h3>
                    <p class="text-gray-600 mb-6">${message}</p>
                    <button class="bg-blue-500 text-white font-bold py-2 px-6 rounded-xl hover:bg-blue-600 transition-colors" onclick="this.closest('.alert-modal').remove()">OK</button>
                </div>
            `;
            document.body.appendChild(modal);
        }

        const userIconBtn = document.getElementById('user-icon-btn');
const popup = document.getElementById('popup');
const loginSection = document.getElementById('login-section');
const logoutSection = document.getElementById('logout-section');
const logoutBtn = document.getElementById('logout-btn');


let isLoggedIn = false; 

const updatePopupDisplay = () => {
    if (isLoggedIn) {
        loginSection.classList.add('hidden');
        logoutSection.classList.remove('hidden');
    } else {
        loginSection.classList.remove('hidden');
        logoutSection.classList.add('hidden');
    }
};

userIconBtn.addEventListener('click', () => {
   
    popup.classList.toggle('hidden');
    
    updatePopupDisplay();
});

logoutBtn.addEventListener('click', () => {
    
    isLoggedIn = false;
    updatePopupDisplay();
    popup.classList.add('hidden'); 
    alert('You have been logged out!'); 
});

document.addEventListener('click', (event) => {
    const isClickInside = userIconBtn.contains(event.target) || popup.contains(event.target);
    if (!isClickInside) {
        popup.classList.add('hidden');
    }
});