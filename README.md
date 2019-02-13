
# AcuStock

[![Logo](https://acustock.wallaceit.com.au/img/logo-small.png)](https://acustock.wallaceit.com.au/)

## Mobile warehouse management for Acumatica

AcuStock is a mobile inventory management app for Acumatica ERP (https://www.acumatica.com/) and other white labelled variants such as MYOB Advanced. It enables data entry for the most common warehouse functions via barcode scanning or manual entry. These functions include:

- Directed picking
- Warehouse location transfers
- Receipt of shipments, transfers (including IN/SO transfers) and purchase orders
- Item & Location stock lookup
- Item stock adjustment (quick cycle-counting)
- Physical count entry

AcuStock is an Ionic framework (https://ionicframework.com/) application. Ionic utilises some awesome modern technologies such as Cordova, Typescript, and Angular to create cross-platform applications. AcuStock is only distributed on Android at the moment but can also be compiled for iOS, Windows Phone and even as a web app for use on any device with a modern browser. 

### Features

- Connects & integrates directly with Acumatica, maintaining maximum data integrity and minimising barrier to entry for new users.
- Advanced caching layer for fast location, item and availability lookup.
- Data entry via standard barcode scanner (keyboard device), camera scanner or manual entry.
- The ability to make corrections to or remove pending items. Pending items are saved locally on the device ensuring you never loose your work.
- Sequenced pick suggestions: Scan items in any order or let the scanner route you through the warehouse based on a pre-defined sequence.
- Configurable vibration and sound alerts.
- Advanced error reporting and diagnostic info can be sent via email.
- Easy setup/provisioning via QR codes.

### Anti-features

- Does not support Lot/Serial tracked items at this stage, but it can and probably will be added in the future.

## Download

Download AcuStock for Android from the Google play store.

[![Download for Android](https://acustock.wallaceit.com.au/img/play-badge-small.png)](https://play.google.com/store/apps/details?id=au.com.wallaceit.acustock&utm_source=acustock_website)

## Setup

AcuStock requires a customisation project to be installed in Acumatica to function.

The customisation project repository can be found [here](https://github.com/micwallace/acustock-acumatica).

To start, download the latest customisation project package from here:

[Acumatica v2018+](https://acustock.wallaceit.com.au/downloads/AcuStock.1.1.1.zip)

[Acumatica 6](https://acustock.wallaceit.com.au/downloads/AcuStock.1.0.2-Acumatica-6.10.zip)

Once downloaded, use the following steps to import and publish the customisation.

- Go the the customisation projects screen in Acumatica
- From the toolbar, click on the import button
- Browse to the .zip file that you downloaded from the link above and then click on the upload button.
- The imported AcuStock project will be displayed in the list.
- Click on the checkbox beside the AcuStock project to enable it for publication and then click on the publish button in the toolbar.
- The Project validation process will be run.
- If validation is successful, you will be presented with a publish button. Click on it to finalise the installation.

Once successfully installed, you can login to AcuStock using your Acumatica credentials.
