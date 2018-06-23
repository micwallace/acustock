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

    defaults = {};

    preferences = {};

    constructor() {
        console.log('Hello PreferencesProvider Provider');

        this.loadPreferences();

        // index defaults
        for (let group of this.schema){
            for (let pref of group.preferences){
                this.defaults[pref.key] = pref.def_value;
            }
        }
    }

    setPreference(key, value, save=false) {
        if (this.defaults.hasOwnProperty(key))
            this.preferences[key] = value;

        if (save)
            this.savePreferences();
    }

    hasPreference(key){
        return this.preferences.hasOwnProperty(key);
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
