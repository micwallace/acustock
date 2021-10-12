/*
 * This file is part of AcuStock
 * Copyright (c) 2018 Michael B Wallace
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

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
                    min_key: "url",
                    title: "URL",
                    type: "url",
                    placeholder: "https://acumaticainstance/url",
                    def_value: ""
                },
					 {
						  key: "endpoint_version",
						  min_key: "evn",
						  title: "Endpoint version",
						  type: "select",
						  options: [
								{label: "6.00.001", value: "6.00.001"},
								{label: "20.200.001", value: "20.200.001"},
						   ],
						  def_value: "6.00.001"
					 },
                {
                    key: "connection_username",
                    min_key: "usr",
                    title: "Username",
                    type: "text",
                    placeholder: "",
                    def_value: ""
                },
                {
                    key: "connection_password",
                    min_key: "pwd",
                    title: "Password",
                    type: "password",
                    placeholder: "",
                    def_value: ""
                },
                {
                    key: "remember_password",
                    min_key: "rpw",
                    title: "Remember password",
                    type: "toggle",
                    placeholder: "",
                    def_value: true
                },
                {
                    key: "connection_company",
                    min_key: "cpy",
                    title: "Company ID",
                    caption: "The company ID (tenant) that should be used for the connection.",
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
                    min_key: "whs",
                    title: "Warehouse",
                    type: "select",
                    def_value: ""
                },
                {
                    key: "device",
                    min_key: "dev",
                    caption: "The device name is used for picking assignment and in transaction descriptions.",
                    title: "Device Name",
                    type: "text",
                    def_value: ""
                }
            ]
        },
        {
            title: "Cache",
            preferences: [
                {
                    key: "cache_expiry",
                    min_key: "cex",
                    title: "Cache Expiry",
                    type: "select",
                    options: [
                        {label: "30 Minutes", value: 1800},
                        {label: "1 Hour", value: 3600},
                        {label: "2 Hours", value: 7200},
                        {label: "4 Hours", value: 14400},
                        {label: "6 Hours", value: 21600},
                        {label: "8 Hours", value: 28800},
                        {label: "12 Hours", value: 43200},
                    ],
                    def_value: 21600
                },
                {
                    key: "cache_prime_items",
                    min_key: "cpi",
                    title: "Prime Item Cache",
                    caption: "This setting determines whether items should be cached when the application starts.",
                    type: "select",
                    options: [
                        {label: "Load all", value: "full"},
                        {label: "Load all in batches", value: "batch"},
                        {label: "Load on demand", value: "none"},
                    ],
                    def_value: "batch"
                },
                {
                    key: "cache_refresh_items",
                    min_key: "cri",
                    title: "Refresh Items Every",
                    type: "select",
                    options: [
                        {label: "30 Minutes", value: 1800},
                        {label: "1 Hour", value: 3600},
                        {label: "2 Hours", value: 7200},
                        {label: "4 Hours", value: 14400},
                        {label: "6 Hours", value: 21600},
                        {label: "8 Hours", value: 28800},
                        {label: "12 Hours", value: 43200},
                    ],
                    def_value: 14400
                },
                {
                    key: "cache_item_warehouse",
                    min_key: "cwh",
                    title: "Cache Item Warehouse",
                    caption: "Cache warehouse specific item options, such as default receiving locations.",
                    type: "select",
                    options: [
                        {label: "With Item Cache", value: "withitems"},
                        {label: "On-Demand (5000+ Items)", value: "ondemand"},
                    ],
                    def_value: "withitems"
                },
            ]
        },
        {
            title: "Sounds & Alerts",
            preferences: [
                {
                    key: "success_sound",
                    min_key: "ss",
                    title: "Scanner Success Sound",
                    type: "select",
                    def_value: "success-3",
                    options: PreferencesProvider.successSounds
                },
                {
                    key: "completed_sound",
                    min_key: "cs",
                    title: "Completed Sound",
                    type: "select",
                    def_value: "success-4",
                    options: PreferencesProvider.successSounds
                },
                {
                    key: "prompt_sound",
                    min_key: "ps",
                    title: "Prompt Sound",
                    type: "select",
                    def_value: "success-1",
                    options: PreferencesProvider.successSounds
                },
                {
                    key: "alert_sound",
                    min_key: "as",
                    title: "Scanner Alert Sound",
                    type: "select",
                    def_value: "alert-4",
                    options: PreferencesProvider.failureSounds
                },
                {
                    key: "alert_vibrate",
                    min_key: "av",
                    title: "Alert & Prompt Vibrate",
                    type: "toggle",
                    def_value: true
                },
                {
                    key: "native_audio",
                    min_key: "na",
                    title: "Use Native Audio",
                    type: "toggle",
                    def_value: false
                }
            ]
        },
        {
            title: "Release Documents",
            preferences: [
                {
                    key: "release_transfers",
                    min_key: "rt",
                    title: "Release Transfers",
                    type: "toggle",
                    def_value: true
                },
                {
                    key: "release_receipts",
                    min_key: "rr",
                    title: "Release Receipts",
                    type: "toggle",
                    def_value: true
                },
                {
                    key: "release_adjustments",
                    min_key: "ra",
                    title: "Release Adjustments",
                    type: "toggle",
                    def_value: true
                }
            ]
        },
        {
            title: "Picking",
            preferences: [
                {
                    key: "pick_assign_check",
                    min_key: "pac",
                    title: "Double-check assignment",
                    caption: "When the start picking button is pressed, reload the pick status from the server.",
                    type: "toggle",
                    def_value: false
                },
                {
                    key: "pick_item_seek",
                    min_key: "pis",
                    title: "Scan any item",
                    caption: "If the scanned item is not the current one, check the whole pick list for the item.",
                    type: "toggle",
                    def_value: false
                },
                {
                    key: "pick_scan_complete",
                    min_key: "psc",
                    title: "Scan auto complete",
                    caption: "When scanning, if the number of required items is reached, automatically add the item to the pending list and move to the next item.",
                    type: "toggle",
                    def_value: true
                }
            ]
        },
        {
            title: "Receiving",
            preferences: [
                {
                    key: "receipt_keep_loc",
                    min_key: "rkl",
                    title: "Keep last location",
                    caption: "Keep the last scanned location rather than setting the specified/suggested location for each item.",
                    type: "toggle",
                    def_value: true
                },
                {
                    key: "receipt_scan_complete",
                    min_key: "rsc",
                    title: "Scan auto complete",
                    caption: "When scanning, if the number of required items is reached, automatically add the item to the pending list and move to the next item.",
                    type: "toggle",
                    def_value: true
                },
                {
                    key: "receipt_confirm_new",
                    min_key: "rcn",
                    title: "New item confirm",
                    caption: "When scanning, if the item is not the one currently being entered, confirm before adding the current one to the pending list.",
                    type: "toggle",
                    def_value: true
                }
            ]
        },
        {
            title: "Counting",
            preferences: [
                {
                    key: "count_confirm_new",
                    min_key: "ccn",
                    title: "Confirm new lines",
                    caption: "Confirm before adding new lines to the count sheet.",
                    type: "toggle",
                    def_value: true
                }
            ]
        },
        {
            title: "Notifications",
            preferences: [
                {
                    key: "error_email",
                    min_key: "nee",
                    caption: "The default email address to send diagnostic reports to.",
                    title: "Diagnostic Email",
                    type: "text",
                    def_value: ""
                },
                {
                    key: "service_email",
                    min_key: "nse",
                    caption: "The default email address to send customer service notifications.",
                    title: "Customer Service Email",
                    type: "text",
                    def_value: ""
                },
            ]
        },
        {
            title: "Scanning",
            preferences: [
                {
                    key: "camera_scan",
                    min_key: "csc",
                    caption: "Whether or not the camera scanning button should be shown throughout the app.",
                    title: "Camera Scanner",
                    type: "toggle",
                    def_value: true
                },
                {
                    key: "scan_threshold",
                    min_key: "sct",
                    caption: "This is used for hardware barcode scanners. You may need to increase this if you are using a slower scanner such as one connected via bluetooth.",
                    title: "Scan Threshold (ms)",
                    type: "text",
                    def_value: 40
                },
            ]
        },
        {
            title: "Theme",
            preferences: [
                {
                    key: "theme",
                    min_key: "thm",
                    title: "Theme",
                    type: "select",
                    def_value: "theme-light",
                    options: [
                        { label: "Light", value: "theme-light"},
                        { label: "Dark", value: "theme-dark"},
                    ]
                },
                {
                    key: "text_size",
                    min_key: "tsz",
                    title: "Text Size",
                    type: "select",
                    def_value: "",
                    options: [
                        { label: "Default", value: ""},
                        { label: "Large (1.8rem)", value: "text-size-18"},
                        { label: "Larger (2rem)", value: "text-size-20"},
                    ]
                }
            ]
        },
        /*{
            title: "Debug",
            preferences: [
                {
                    key: "debug",
                    title: "Debug",
                    type: "toggle",
                    def_value: false
                }
            ]
        }*/
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
        { label: "Alert 7", value: "alert-7" },
        { label: "Alert 8", value: "alert-8" }
    ];

    preferences = {};

    private defaults = {};

    public minMap = {};

    constructor() {
        console.log('Hello PreferencesProvider Provider');

        this.loadPreferences();

        // load defaults
        for (let group of this.schema) {
            for (let pref of group.preferences) {
                if (!this.preferences.hasOwnProperty(pref.key))
                    this.preferences[pref.key] = pref.def_value;

                this.defaults[pref.key] = pref.def_value;

                this.minMap[pref.key] = pref.min_key;
                this.minMap[pref.min_key] = pref.key;
            }
        }
    }

    isSetupComplete() {
        return (this.hasPreference("connection_url") && this.hasPreference("connection_username") && this.hasPreference("connection_company"));
    }

    setPreference(key, value, save = false) {
        if (this.preferences.hasOwnProperty(key))
            this.preferences[key] = value;

        if (save)
            this.savePreferences();
    }

    hasPreference(key) {
        return this.preferences.hasOwnProperty(key) && this.preferences[key] != "";
    }

    getPreference(key) {
        if (!this.preferences.hasOwnProperty(key)) {
            return null;
        }

        return this.preferences[key];
    }

    getDefault(key){
        if (!this.defaults.hasOwnProperty(key)) {
            return null;
        }

        return this.defaults[key];
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
