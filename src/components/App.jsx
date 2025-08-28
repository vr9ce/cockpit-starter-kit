// @ts-check

import React from "react"
import cockpit from "cockpit"

/**
 * @type {IDBDatabase}
 */
const db = await new Promise(
    (res, rej) => {
        const open_db_req = indexedDB.open("shynur", 1)
        /**
         * @param {IDBVersionChangeEvent} event
         */
        open_db_req.onupgradeneeded = function(event) {
            const db = this.result
            switch (event.oldVersion) {
                case 0:
                    db.createObjectStore("ProcTree", {keyPath: "timestamp"})
                    break
                default:
                    rej(new Error(`不支持的 IndexedDB/shynur 版本: ${event.oldVersion}`))
            }
        }
        open_db_req.onblocked = function() {
            alert("请关闭其它打开本网页客户端的旧版本标签页, 然后刷新本页面!")
            rej(new Error)
        }
        open_db_req.onerror = function() {rej(this.error)}
        open_db_req.onsuccess = function() {
            const db = this.result
            db.onversionchange = function () {
                this.close()
                alert("网页客户端有新版本, 请关闭当前页面 (旧页面)!")
                rej(new Error)
            }

            res(db)
        }
    }
)

!async function fetchDataPeriodically() {
    const stdout = await cockpit.spawn(
        [
            "bash", "-c",
            `. ~/.nvm/nvm.sh; node --input-type=module -e "${
                "`cat /usr/local/bin/psutil.mjs`;"
                + "console.log(JSON.stringify({timestamp:Date.now()/1e3,data:await makeProcTree_Linux(1)}))"
            }"`
        ]
    )

    const tx = db.transaction("ProcTree", "readwrite")
    await new Promise(
        (res, rej) => {
            tx.oncomplete = function () {
                console.log("成功从控制器获取到一次 '/proc' 采样并保存到本地客户端")
                res(undefined)
            }
            tx.onerror = function () {rej(this.error)}
            tx.objectStore("ProcTree").add(JSON.parse(stdout))
        }
    ).catch(
        err => console.error("从控制器获取 '/proc' 采样失败: " + err.message)
    )

    setTimeout(fetchDataPeriodically, 5_000)
}()

import Panel from "./Panel.jsx"

export default function () {
    return <Panel procTreeArray={[]} />
}
