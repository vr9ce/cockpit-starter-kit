// @ts-check

import React, {useState, useEffect} from "react"
import cockpit from "cockpit"

const proc_tree_open_db_req = indexedDB.open("shynur", 1)

/**
 * @param {IDBVersionChangeEvent} event
 */
proc_tree_open_db_req.onupgradeneeded = function(event) {
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
        const store_samples = db.createObjectStore("ProcTree", {keyPath: "timestamp"})
    }

    function upgrade_to_2() {}
}

proc_tree_open_db_req.onerror = function() {console.error(this.error)}

proc_tree_open_db_req.onsuccess = function() {
    const db = this.result

    db.onversionchange = function() {
        this.close()
        alert("网页客户端有新版本, 请关闭当前页面 (旧页面)!")
    }

    // @ts-ignore
    !function fetchDataPeriodically() {
        new Promise(res => res(cockpit.spawn([
            "bash", "-c",
            `. ~/.nvm/nvm.sh; node --input-type=module -e "${
                '`cat /usr/local/bin/psutil.mjs`;'
                + 'console.log(JSON.stringify({timestamp:Date.now()/1e3,data:await makeProcTree_Linux(1)}))'
            }"`
        ]))).then(
            res => {
                const tx = db.transaction("ProcTree", "readwrite")

                const req = tx.objectStore("ProcTree").add(JSON.parse(res))
                req.onerror = function(event) {console.log(this.error)}

                tx.oncomplete = function() {
                    console.log("成功从控制器获取到一次 '/proc' 采样并保存到本地客户端")
                }
            }
        ).catch(
            err => console.error("从控制器获取 '/proc' 采样失败: " + err.message)
        ).finally(() => setTimeout(fetchDataPeriodically, 5_000))
    }()
}

proc_tree_open_db_req.onblocked = function() {
    alert("请关闭其它打开本网页客户端的旧版本标签页, 然后刷新本页面!")
}

export default function() {
    return <pre>1</pre>
}
