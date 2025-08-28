/**
 * @type {IDBDatabase}
 */
export default new Promise(
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
