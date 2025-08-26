import React, {StrictMode, useEffect, useState} from "react"
import {Alert} from "@patternfly/react-core/dist/esm/components/Alert/index.js"
import {Card, CardBody, CardTitle} from "@patternfly/react-core/dist/esm/components/Card/index.js"
import cockpit from "cockpit"

import Game from "./components/Game.jsx"

export function Application() {
    const [hostname, setHostname] = useState(cockpit.gettext("Unknown"))

    useEffect(() => {
        const hostname = cockpit.file("/etc/hostname")
        hostname.watch(content => setHostname(content?.trim() ?? ""))
        return hostname.close
    }, [])

    return (
        <StrictMode>
            <Card>
                <CardTitle>Starter Kit</CardTitle>
                <CardBody>
                    <Alert variant='info' title={cockpit.format(cockpit.gettext("Running on $0"), hostname)} />
                </CardBody>
                <Game />
            </Card>
        </StrictMode>
    )
}
