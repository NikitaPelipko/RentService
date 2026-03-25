(function () {
    "use strict";

    function addClasses(element, classes) {
        if (!element) {
            return;
        }

        classes.split(" ").forEach(function (className) {
            if (className) {
                element.classList.add(className);
            }
        });
    }

    function removeClasses(element, classes) {
        if (!element) {
            return;
        }

        classes.split(" ").forEach(function (className) {
            if (className) {
                element.classList.remove(className);
            }
        });
    }

    function applyDayStateClasses(day) {
        if (!day) {
            return;
        }

        removeClasses(day, "bg-indigo-50 text-indigo-700 bg-indigo-600 text-white");

        if (day.classList.contains("inRange")) {
            addClasses(day, "bg-indigo-50 text-indigo-700");
        }

        if (
            day.classList.contains("startRange") ||
            day.classList.contains("endRange") ||
            day.classList.contains("selected")
        ) {
            addClasses(day, "bg-indigo-600 text-white");
        }
    }

    function styleCalendar(instance) {
        var calendar = instance && instance.calendarContainer;
        if (!calendar) {
            return;
        }

        addClasses(calendar, "p-3 rounded-3xl border border-slate-100 shadow-2xl shadow-indigo-100 bg-white");

        var monthNav = calendar.querySelector(".flatpickr-months");
        addClasses(monthNav, "mb-2 px-1");

        var currentMonth = calendar.querySelector(".flatpickr-current-month");
        addClasses(currentMonth, "text-slate-900 font-bold");

        var monthDropdown = calendar.querySelector(".flatpickr-monthDropdown-months");
        addClasses(monthDropdown, "rounded-lg px-1 text-slate-800 font-semibold");

        var yearInput = calendar.querySelector(".numInputWrapper input");
        addClasses(yearInput, "text-slate-700 font-semibold");

        var weekdays = calendar.querySelectorAll(".flatpickr-weekday");
        weekdays.forEach(function (weekday) {
            addClasses(weekday, "text-slate-400 font-bold text-[11px] uppercase");
        });

        var days = calendar.querySelectorAll(".flatpickr-day");
        days.forEach(function (day) {
            addClasses(day, "rounded-xl text-slate-700 font-semibold transition-colors duration-150 hover:bg-indigo-50 hover:text-indigo-600");
            applyDayStateClasses(day);
        });

        var arrows = calendar.querySelectorAll(".flatpickr-prev-month, .flatpickr-next-month");
        arrows.forEach(function (arrow) {
            addClasses(arrow, "rounded-xl text-slate-500 hover:bg-slate-100 hover:text-indigo-600 transition-colors duration-150");
        });
    }

    function toIsoDate(date) {
        return date.toISOString().split("T")[0];
    }

    function initSearchDateRange() {
        var input = document.getElementById("search-dates");

        if (!input || typeof flatpickr !== "function") {
            return;
        }

        var picker = flatpickr(input, {
            mode: "range",
            minDate: "today",
            dateFormat: "d.m.Y",
            conjunction: " - ",
            locale: "ru",
            disableMobile: true,
            onReady: function (_, __, instance) {
                styleCalendar(instance);
            },
            onOpen: function (_, __, instance) {
                styleCalendar(instance);
            },
            onMonthChange: function (_, __, instance) {
                styleCalendar(instance);
            },
            onChange: function (selectedDates) {
                styleCalendar(picker);

                if (selectedDates.length === 1) {
                    input.placeholder = "Выберите дату отъезда";
                    if (window.appLogger) {
                        window.appLogger.info("checkin_selected", {
                            checkIn: toIsoDate(selectedDates[0])
                        });
                    }
                }

                if (selectedDates.length === 2) {
                    input.placeholder = "Дата приезда - дата отъезда";
                    if (window.appLogger) {
                        window.appLogger.info("date_range_selected", {
                            checkIn: toIsoDate(selectedDates[0]),
                            checkOut: toIsoDate(selectedDates[1])
                        });
                    }
                }
            }
        });

        input.addEventListener("focus", function () {
            picker.open();
        });

        if (window.appLogger) {
            window.appLogger.info("date_picker_initialized", {
                inputId: "search-dates"
            });
        }
    }

    document.addEventListener("DOMContentLoaded", initSearchDateRange);
})();
