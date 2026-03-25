(function () {
    "use strict";

    var STORAGE_KEY = "mireastay_logs";

    function saveLog(entry) {
        try {
            var logs = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
            logs.push(entry);
            if (logs.length > 100) {
                logs = logs.slice(logs.length - 100);
            }
            localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
        } catch (error) {
            console.warn("[MireaStay] Не удалось сохранить лог:", error);
        }
    }

    function log(level, event, details) {
        var entry = {
            timestamp: new Date().toISOString(),
            level: level,
            event: event,
            page: window.location.pathname,
            details: details || {}
        };

        if (level === "error") {
            console.error("[MireaStay]", event, entry.details);
        } else {
            console.info("[MireaStay]", event, entry.details);
        }

        saveLog(entry);
    }

    window.appLogger = {
        info: function (event, details) {
            log("info", event, details);
        },
        error: function (event, details) {
            log("error", event, details);
        }
    };

    document.addEventListener("DOMContentLoaded", function () {
        document.addEventListener("formValid", function (event) {
            var formData = event.detail || {};

            console.clear();
            console.log("ФИО:", formData.fullname || "(не заполнено)");
            console.log("Телефон:", formData.phone || "(не заполнено)");
            console.log("Email:", formData.email || "(не заполнено)");
            console.log("Сообщение:", formData.message || "(не заполнено)");
            console.log("Время отправки:", new Date().toLocaleString());

            log("info", "form_valid_console_log", {
                formId: formData.formId || null,
                fields: formData
            });
        });
    });
})();
