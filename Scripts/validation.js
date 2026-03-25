(function () {
    "use strict";

    function extractFormData(form, fields) {
        var data = {
            formId: form.id || null
        };

        fields.forEach(function (field) {
            if (!field.name) {
                return;
            }

            if (field.type === "checkbox") {
                data[field.name] = field.checked;
                return;
            }

            data[field.name] = String(field.value || "").trim();
        });

        data.fullname = data.fullname || data.name || "";
        data.phone = data.phone || "";
        data.email = data.email || "";
        data.message = data.message || "";

        return data;
    }

    function parseRuDate(value) {
        var parts = String(value || "").split(".");
        if (parts.length !== 3) {
            return null;
        }

        var day = Number(parts[0]);
        var month = Number(parts[1]) - 1;
        var year = Number(parts[2]);
        var parsed = new Date(year, month, day);

        if (
            Number.isNaN(parsed.getTime()) ||
            parsed.getDate() !== day ||
            parsed.getMonth() !== month ||
            parsed.getFullYear() !== year
        ) {
            return null;
        }

        return parsed;
    }

    function isFullNameField(field) {
        var key = String(field.name || field.id || "").toLowerCase();
        return key === "name" || key === "fullname" || field.dataset.fullname === "true";
    }

    function normalizePhoneDigits(value) {
        var digits = String(value || "").replace(/\D/g, "").slice(0, 11);

        if (!digits) {
            return "";
        }

        if (digits[0] === "8" || digits[0] === "7") {
            digits = "7" + digits.slice(1);
        } else {
            digits = "7" + digits;
        }

        return digits.slice(0, 11);
    }

    function formatPhoneDigits(digits) {
        if (!digits) {
            return "";
        }

        var formatted = "+7";
        if (digits.length > 1) {
            formatted += " (" + digits.slice(1, 4);
        }
        if (digits.length >= 4) {
            formatted += ") " + digits.slice(4, 7);
        }
        if (digits.length >= 7) {
            formatted += "-" + digits.slice(7, 9);
        }
        if (digits.length >= 9) {
            formatted += "-" + digits.slice(9, 11);
        }

        return formatted;
    }

    function countDigitsBeforeCaret(value, caretPos) {
        return String(value || "")
            .slice(0, caretPos)
            .replace(/\D/g, "")
            .length;
    }

    function caretPositionForDigits(value, digitsBeforeCaret) {
        if (digitsBeforeCaret <= 0) {
            return 0;
        }

        var seen = 0;
        for (var i = 0; i < value.length; i += 1) {
            if (/\d/.test(value[i])) {
                seen += 1;
                if (seen === digitsBeforeCaret) {
                    return i + 1;
                }
            }
        }

        return value.length;
    }

    function setFieldError(field, message) {
        var errorId = field.id + "-error";
        var errorNode = document.getElementById(errorId);

        field.classList.add("ring-2", "ring-red-400");
        field.setAttribute("aria-invalid", "true");

        if (!errorNode) {
            errorNode = document.createElement("p");
            errorNode.id = errorId;
            errorNode.className = "text-sm text-red-600 mt-1";
            field.insertAdjacentElement("afterend", errorNode);
        }

        errorNode.textContent = message;
    }

    function clearFieldError(field) {
        var errorId = field.id + "-error";
        var errorNode = document.getElementById(errorId);

        field.classList.remove("ring-2", "ring-red-400");
        field.removeAttribute("aria-invalid");

        if (errorNode) {
            errorNode.remove();
        }
    }

    function validateField(field) {
        clearFieldError(field);

        if (field.type === "checkbox" && field.required && !field.checked) {
            setFieldError(field, "Необходимо подтвердить согласие.");
            return false;
        }

        if (field.required && !String(field.value || "").trim()) {
            setFieldError(field, "Поле обязательно для заполнения.");
            return false;
        }

        if (isFullNameField(field) && field.value) {
            var parts = String(field.value || "")
                .trim()
                .split(/\s+/)
                .filter(Boolean);

            var wordPattern = /^[A-Za-zА-Яа-яЁё'-]+$/;
            var validWords = parts.every(function (part) {
                return wordPattern.test(part);
            });

            if (parts.length < 2 || !validWords) {
                setFieldError(field, "Введите имя и фамилию");
                return false;
            }
        }

        if (field.type === "email" && field.value) {
            var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailPattern.test(field.value.trim())) {
                setFieldError(field, "Введите корректный email.");
                return false;
            }
        }

        if (field.dataset.phone === "true") {
            var phoneDigits = String(field.value || "").replace(/\D/g, "");
            if (phoneDigits.length < 10) {
                setFieldError(field, "Введите не менее 10 цифр номера телефона.");
                return false;
            }
        }

        if (field.dataset.dateRange === "true") {
            var checkIn = null;
            var checkOut = null;

            if (field._flatpickr && Array.isArray(field._flatpickr.selectedDates)) {
                checkIn = field._flatpickr.selectedDates[0] || null;
                checkOut = field._flatpickr.selectedDates[1] || null;
            }

            if (!checkIn || !checkOut) {
                var rangeValue = String(field.value || "").trim();
                var rangeParts = rangeValue
                    .split(/\s+-\s+|\s+to\s+|\s+по\s+|\s+—\s+/i)
                    .map(function (item) {
                        return item.trim();
                    })
                    .filter(Boolean);

                if (rangeParts.length !== 2) {
                    setFieldError(field, "Выберите дату приезда и дату отъезда.");
                    return false;
                }

                checkIn = parseRuDate(rangeParts[0]);
                checkOut = parseRuDate(rangeParts[1]);

                if (!checkIn || !checkOut) {
                    setFieldError(field, "Проверьте формат дат.");
                    return false;
                }
            }

            if (checkOut <= checkIn) {
                setFieldError(field, "Дата отъезда должна быть позже даты приезда.");
                return false;
            }
        }

        if (field.dataset.type === "number") {
            var numericValue = Number(field.value);
            var min = field.dataset.min ? Number(field.dataset.min) : null;

            if (Number.isNaN(numericValue) || !Number.isInteger(numericValue)) {
                setFieldError(field, "Введите целое число.");
                return false;
            }

            if (min !== null && numericValue < min) {
                setFieldError(field, "Значение должно быть не меньше " + min + ".");
                return false;
            }
        }

        if (field.dataset.minLength) {
            var minLength = Number(field.dataset.minLength);
            if (String(field.value || "").trim().length < minLength) {
                setFieldError(field, "Минимум " + minLength + " символа(ов).");
                return false;
            }
        }

        return true;
    }

    function setupFormValidation(form) {
        var fields = form.querySelectorAll("input, select, textarea");

        fields.forEach(function (field) {
            field.addEventListener("blur", function () {
                validateField(field);
            });

            field.addEventListener("input", function () {
                if (field.getAttribute("aria-invalid") === "true") {
                    validateField(field);
                }
            });
        });

        form.addEventListener("submit", function (event) {
            var isValid = true;
            var invalidFields = [];

            fields.forEach(function (field) {
                var result = validateField(field);
                if (!result) {
                    isValid = false;
                    invalidFields.push(field.name || field.id || field.type);
                }
            });

            if (!isValid) {
                event.preventDefault();
                if (window.appLogger) {
                    window.appLogger.error("validation_failed", {
                        formId: form.id || null,
                        invalidFields: invalidFields
                    });
                }
                return;
            }

            event.preventDefault();
            var validFormData = extractFormData(form, fields);

            document.dispatchEvent(new CustomEvent("formValid", {
                detail: validFormData
            }));

            if (window.appLogger) {
                window.appLogger.info("form_submitted", {
                    formId: form.id || null,
                    data: validFormData
                });
            }
            alert("Форма прошла валидацию и готова к отправке.");
        });
    }

    document.addEventListener("DOMContentLoaded", function () {
        var forms = document.querySelectorAll("form[data-validate='true']");

        forms.forEach(function (form) {
            setupFormValidation(form);
        });

        if (window.appLogger) {
            window.appLogger.info("validation_initialized", {
                formsCount: forms.length
            });
        }

        // Phone mask
        document.querySelectorAll("input[data-phone='true']").forEach(function (input) {
            input.addEventListener("keydown", function (event) {
                if (event.key !== "Backspace") {
                    return;
                }

                var value = input.value;
                var caret = input.selectionStart || 0;

                if (!value || caret === 0) {
                    return;
                }

                var digits = normalizePhoneDigits(value);
                if (!digits) {
                    return;
                }

                var digitsBeforeCaret = countDigitsBeforeCaret(value, caret);
                var removeIndex = Math.max(1, digitsBeforeCaret - 1);

                if (digits.length <= 1 || removeIndex >= digits.length) {
                    event.preventDefault();
                    input.value = "";
                    return;
                }

                event.preventDefault();

                var nextDigits = digits.slice(0, removeIndex) + digits.slice(removeIndex + 1);
                if (nextDigits.length <= 1) {
                    input.value = "";
                    return;
                }

                input.value = formatPhoneDigits(nextDigits);

                var nextCaretDigits = Math.max(1, removeIndex);
                var nextCaret = caretPositionForDigits(input.value, nextCaretDigits);
                input.setSelectionRange(nextCaret, nextCaret);
            });

            input.addEventListener("input", function () {
                var digits = normalizePhoneDigits(input.value);
                if (!digits || digits.length <= 1) {
                    input.value = "";
                    return;
                }

                input.value = formatPhoneDigits(digits);
            });
        });
    });
})();
