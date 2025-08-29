// @ts-check

import React, {useState, useEffect} from "react"
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

/***********************************************/

import {
    Page, Masthead, MastheadMain, MastheadToggle, MastheadBrand, MastheadLogo,
    MastheadContent, PageSidebar, PageSidebarBody, PageSection, PageToggleButton, Toolbar,
    ToolbarContent, ToolbarItem
} from '@patternfly/react-core'
import ItemExplorer from "./ItemExplorer.jsx"
import "@patternfly/react-core/dist/styles/base.css"

export default function () {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true)
    const masthead = (
        <Masthead>
            <MastheadMain>
                <MastheadToggle>
                    <PageToggleButton
                        isHamburgerButton
                        aria-label='Global navigation'
                        isSidebarOpen={isSidebarOpen}
                        onSidebarToggle={() => setIsSidebarOpen(!isSidebarOpen)}
                        id='vertical-nav-toggle'
                    />
                </MastheadToggle>
            </MastheadMain>
            <MastheadContent>
                <Toolbar id='vertical-toolbar'>
                    <ToolbarContent>
                        <ToolbarItem>
                            进程资源占用监视器
                        </ToolbarItem>
                    </ToolbarContent>
                </Toolbar>
            </MastheadContent>
        </Masthead>
    )

    const [procTreeSamples, setProcTreeSamples] = useState([])
    useEffect(
        () => {
            let timeoutId = 0
            !async function fetchSamples() {
                (await db)
                    .transaction("ProcTree", "readonly")
                    .objectStore("ProcTree")
                    .getAll(IDBKeyRange.lowerBound(Date.now()/1e3 - 600))
                    .onsuccess = function() {
                        const fetchedSamples = [...this.result]
                        if (
                            fetchedSamples.slice(-1)[0].timestamp
                            // @ts-ignore
                            != procTreeSamples.slice(-1)[0]?.timestamp
                        )
                            setProcTreeSamples(this.result)
                    }
                timeoutId = setTimeout(fetchSamples, 5_000)
            }()
            return () => clearTimeout(timeoutId)
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []
    )

    const [userSelected, setUserSelected] = useState(/** @type {Set<number>} */ (new Set))
    const procTreeArray = procTreeSamples.length ? [
        {
            ...function makeProcTreeArray(procTree) {
                return {
                    name: `${procTree.self.status.Name}`,
                    id: `PID=${procTree.self.status.Pid}`,
                    checkProps: {checked: !!userSelected.has(procTree.self.status.Pid)},
                    children: procTree.children.length ? procTree.children.sort(
                        // @ts-ignore
                        (p1, p2) => p1.self.status.Pid - p2.self.status.Pid
                    ).map(makeProcTreeArray) : undefined,
                    defaultExpanded: false
                }
            // @ts-ignore
            }(procTreeSamples.slice(-1)[0].data),
            defaultExpanded: true,
        }
    ] : []

    const sidebar = (
        <PageSidebar isSidebarOpen={isSidebarOpen} id='vertical-sidebar'>
            <PageSidebarBody>
                <ItemExplorer
                    procTreeArray={procTreeArray}
                    onNewSelect={()=>{}}
                />
            </PageSidebarBody>
        </PageSidebar>
    )

    return (
        <Page masthead={masthead} sidebar={sidebar}>
            <PageSection aria-labelledby='section-1'>
                <h2 id='section-1'>
                    Vertical nav example section 1
                </h2>
            </PageSection>
        </Page>
    )
}
