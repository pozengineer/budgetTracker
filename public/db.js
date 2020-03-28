let db;
// create a new db request for a "budget" database.
const request = indexedDB.open("budget", 2);

request.onerror = function (event) {
    console.log("Error opening database: " + event);
};

request.onsuccess = event => {
    db = event.target.result;
    console.log("onsuccess: " + event.target.result);
};

request.onupgradeneeded = function (event) {
    // create object store called "pending" and set autoIncrement to true
    db = event.target.result;
    // db.createObjectStore("pending", { autoIncrement: true });

    // Creates an object store with a date keypath that can be used to query on. Date is unique. The keypath must be a key in the object
    const budgetStore = db.createObjectStore("pending", {
        keyPath: "date"
    });
    // Creates a dateIndex that we can query on. Date is the most likely unique identifier
    budgetStore.createIndex("dateIndex", "date", { unique: false });
};

request.onsuccess = function (event) {
    db = event.target.result;

    // check if app is online before reading from db
    if (navigator.onLine) {
        checkDatabase();
    }
};

request.onerror = function (event) {
    console.log("Woops! " + event.target.errorCode);
};

function saveRecord(record) {
    console.log("saverecord run"); // console logs
    console.log("request: " + request); // console logs and shows request
    // create a transaction on the pending db with readwrite access
    const transaction = db.transaction(["pending"], "readwrite");

    // access your pending object store
    const objectStore = transaction.objectStore("pending");
    console.log("Data: " + JSON.stringify(record));
    // add record to your store with add method.
    objectStore.add(record);
}

function checkDatabase() {
    console.log("checkdatabase run");
    console.log("db: ", db);
    // open a transaction on your pending db
    const transaction = db.transaction(["pending"], "readwrite");
    // access your pending object store
    const objectStore = transaction.objectStore("pending");
    // get all records from store and set to a variable
    const objectStoreRequest = objectStore.getAll();

    objectStoreRequest.onsuccess = function () {
        // console.log("objectStoreRequest: ", objectStoreRequest);
        // event.target.result.forEach(transferMongo);
        // console.log("transactions final: ", transactions);

        if (objectStoreRequest.result.length > 0) {
            fetch("/api/transaction/bulk", {
                method: "POST",
                body: JSON.stringify(objectStoreRequest.result),
                headers: {
                    Accept: "application/json, text/plain, */*",
                    "Content-Type": "application/json"
                }
            })
                .then(response => response.json())
                .then(data => {
                    if (data.errors) {
                        errorEl.textContent = "Missing Information";
                    }
                    else {
                        clearIndexedDB();
                    }
                });
        }
    };
}

function clearIndexedDB() {
    // if successful, open a transaction on your pending db
    const transaction = db.transaction(["pending"], "readwrite");

    // access your pending object store
    const objectStore = transaction.objectStore("pending");

    // clear all items in your store
    var clearObjectStore = objectStore.clear();
    clearObjectStore.onsuccess = function (event) {
        console.log("IndexedDB store cleared!");
    }
}

function transferMongo(item) {
    console.log("transferMongo run", item);
    transactions.unshift(item);
}

// listen for app coming back online
window.addEventListener("online", checkDatabase);
