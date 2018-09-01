import { Injectable } from '@angular/core';

/*
 Generated class for the PreferencesProvider provider.

 See https://angular.io/guide/dependency-injection for more info on providers
 and Angular DI.
 */
@Injectable()
export class PreferencesProvider {

    public schema = [
        {
            title: "Connection",
            preferences: [
                {
                    key: "connection_url",
                    title: "URL",
                    type: "url",
                    placeholder: "https://acumaticainstance/url",
                    def_value: ""
                },
                {
                    key: "connection_username",
                    title: "Username",
                    type: "text",
                    placeholder: "",
                    def_value: ""
                },
                {
                    key: "connection_password",
                    title: "Password",
                    type: "password",
                    placeholder: "",
                    def_value: ""
                },
                {
                    key: "connection_company",
                    title: "Company ID",
                    type: "text",
                    placeholder: "",
                    def_value: "Company"
                }
            ]
        },
        {
            title: "General",
            preferences: [
                {
                    key: "warehouse",
                    title: "Warehouse",
                    type: "select",
                    def_value: ""
                },
                {
                    key: "device",
                    title: "Device Name",
                    type: "text",
                    def_value: "Device 1"
                }
            ]
        },
        {
            title: "Cache",
            preferences: [
                {
                    key: "cache_prime_items",
                    title: "Prime Item Cache",
                    type: "select",
                    options: [
                        {label: "Load all", value: "full"},
                        {label: "Load all in batches", value: "batch"},
                        {label: "Load on demand", value: "none"},
                    ],
                    def_value: "batch"
                }
            ]
        },
        {
            title: "Sounds & Alerts",
            preferences: [
                {
                    key: "success_sound",
                    title: "Scanner Success Sound",
                    type: "select",
                    def_value: "success-1",
                    options: PreferencesProvider.successSounds
                },
                {
                    key: "prompt_sound",
                    title: "Prompt Sound",
                    type: "select",
                    def_value: "success-1",
                    options: PreferencesProvider.successSounds
                },
                {
                    key: "alert_sound",
                    title: "Scanner Alert Sound",
                    type: "select",
                    def_value: "alert-1",
                    options: PreferencesProvider.failureSounds
                },
                {
                    key: "alert_vibrate",
                    title: "Alert & Prompt Vibrate",
                    type: "toggle",
                    def_value: true
                }
            ]
        },
        {
            title: "Debug",
            preferences: [
                {
                    key: "debug",
                    title: "Debug",
                    type: "toggle",
                    def_value: false
                }
            ]
        }
    ];

    public static successSounds = [
        { label: "Off", value: "" },
        { label: "Success 1", value: "success-1" },
        { label: "Success 2", value: "success-2" },
        { label: "Success 3", value: "success-3" },
        { label: "Success 4", value: "success-4" },
        { label: "Success 5", value: "success-5" },
        { label: "Success 6", value: "success-6" },
        { label: "Success 7", value: "success-7" }
    ];

    public static failureSounds = [
        { label: "Off", value: "" },
        { label: "Alert 1", value: "alert-1" },
        { label: "Alert 2", value: "alert-2" },
        { label: "Alert 3", value: "alert-3" },
        { label: "Alert 4", value: "alert-4" },
        { label: "Alert 5", value: "alert-5" },
        { label: "Alert 6", value: "alert-6" },
        { label: "Alert 7", value: "alert-7" }
    ];

    defaults = {};

    preferences = {};

    constructor() {
        console.log('Hello PreferencesProvider Provider');

        this.loadPreferences();

        // index defaults
        for (let group of this.schema) {
            for (let pref of group.preferences) {
                this.defaults[pref.key] = pref.def_value;
            }
        }
    }

    isSetupComplete() {
        return (this.hasPreference("connection_url") && this.hasPreference("connection_username") && this.hasPreference("connection_company"));
    }

    setPreference(key, value, save = false) {
        if (this.defaults.hasOwnProperty(key))
            this.preferences[key] = value;

        if (save)
            this.savePreferences();
    }

    hasPreference(key) {
        return this.preferences.hasOwnProperty(key) && this.preferences[key] != "";
    }

    getPreference(key) {
        if (!this.preferences.hasOwnProperty(key))
            return this.defaults[key];

        return this.preferences[key];
    }

    loadPreferences() {

        var prefs = JSON.parse(localStorage.getItem("preferences"));

        if (!prefs)
            prefs = {};

        this.preferences = prefs;
    }

    savePreferences() {
        localStorage.setItem("preferences", JSON.stringify(this.preferences));
    }

}
