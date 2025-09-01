// @ts-check

import React, {useState, useEffect} from "react"
import cockpit from "cockpit"

async function fetchProcTreeSample() {
    const stdout = await cockpit.spawn(
        [
            "bash", "-c",
            `. ~/.nvm/nvm.sh; node --input-type=module -e "${
                "`cat /usr/local/bin/psutil.mjs`;"
                + "console.log(JSON.stringify({timestamp:Date.now()/1e3,data:await makeProcTree_Linux(1)}))"
            }"`
        ]
    )

    return JSON.parse(stdout)
}

/***********************************************/

import {
    Page, Masthead, MastheadMain, MastheadToggle,
    MastheadContent, PageSidebar, PageSidebarBody, PageSection, PageToggleButton, Toolbar,
    ToolbarContent, ToolbarItem
} from '@patternfly/react-core'
import ItemExplorer from "./ItemExplorer.jsx"
import "@patternfly/react-core/dist/styles/base.css"
import StackChart from "./StackChart.jsx"

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
                setProcTreeSamples(
                    // @ts-ignore
                    [...procTreeSamples, await fetchProcTreeSample()]
                )
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
                    checkProps: {/*checked: !!userSelected.has(procTree.self.status.Pid)*/},
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
                    onNewSelect={setUserSelected}
                />
            </PageSidebarBody>
        </PageSidebar>
    )

    useEffect(() => {
        console.log("userSelected", userSelected)
        console.log("procTreeSamples", procTreeSamples)
    }, [userSelected, procTreeSamples])

    return (
        <Page masthead={masthead} sidebar={sidebar}>
            <PageSection aria-labelledby='section-1'>
                <StackChart show={userSelected} procTreeSamples={procTreeSamples} />
            </PageSection>
        </Page>
    )
}
