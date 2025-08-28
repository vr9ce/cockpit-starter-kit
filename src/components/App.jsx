// @ts-check

import React from "react"
import cockpit from "cockpit"
import db from "../db.mjs"


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

    const tx = (await db).transaction("ProcTree", "readwrite")
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
    return <Panel procTreeArray={[
        {
            name: "正在加载中...",
            id: "loading",
            checkProps: {checked: false, "aria-label": "Loading"},
            defaultExpanded: true
        }
    ]} />
}
