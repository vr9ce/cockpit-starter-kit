import React, {useState, useEffect} from "react"

const proc_tree_open_db_req = indexedDB.open("ProcTree", 1)

/**
 * @param {IDBVersionChangeEvent} event
 */
proc_tree_open_db_req.onupgradeneeded = function (event) {
    const db = this.result

    switch (event.oldVersion) {
        case 0:
            upgrade_to_1()
            break
        case 1:
            upgrade_to_2()
            break
    }

    function upgrade_to_1() {
        const store_samples = db.createObjectStore("samples", {keyPath: "timestamp"})
    }

    function upgrade_to_2() {}
}

proc_tree_open_db_req.onerror = function () {
    console.error(this.error)
}

proc_tree_open_db_req.onsuccess = function () {
    const db = this.result

    db.onversionchange = function () {
        this.close()
        alert("网页客户端有新版本, 请关闭当前页面 (旧页面)!")
    }
}

proc_tree_open_db_req.onblocked = function () {
    alert("请关闭其它打开本网页客户端的旧版本标签页, 然后刷新本页面!")
}

export default function () {
    return <pre>1</pre>
}
