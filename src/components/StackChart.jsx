// @ts-check

import React, {useEffect, useRef} from "react"
import * as echarts from "echarts"
import { PiedPiperAltIcon } from "@patternfly/react-icons"

/**
 * @param {Set<number>} show
 * @param {Array<{timestamp: number, data: object}>} procTreeSamples
 */
export default function ({show, procTreeSamples}) {
    const flat_samples = procTreeSamples.map(
        sample => ({
            timestamp: sample.timestamp,
            processes: new Map(
                // @ts-ignore
                function flatten(proc_tree) {
                    const samples = [[proc_tree.self.status.Pid, proc_tree.self]]
                    for (const child of proc_tree.children)
                        samples.push(...flatten(child))
                    return samples
                }(sample.data)
            )
        })
    )
    flat_samples.length && [...flat_samples.slice(-1)[0].processes.keys()].forEach(
        pid => {
            if (!show.has(pid))
                flat_samples.slice(-1)[0].processes.delete(pid)
        }
    )

    const chartRef = useRef(null)
    useEffect(() => {
        if (flat_samples.length == 0)
            return

        const chart = echarts.init(chartRef.current)

        const option = {
            animation: false,
            title: {text: "进程内存占用"},
            tooltip: {trigger: "axis", axisPointer: {type: "cross"}},
            xAxis: [{
                type: "category",
                boundaryGap: false,
                data: flat_samples.map(s => new Date(s.timestamp * 1000).toLocaleTimeString())
            }],
            yAxis: [{type: "value"}],
            series: [...flat_samples.slice(-1)[0].processes].map(
                ([pid, proc]) => ({
                    name: proc.status.Name,
                    type: "line", stack: "Total", smooth: true,
                    lineStyle: {width: 0},
                    showSymbol: false,
                    areaStyle: {
                        opacity: 0.8,
                        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, function() {
                            const color = `rgb(${pid & 0xff},${pid >> 8 & 0xff},${pid >> 16 & 0xff})`
                            return [{offset: 0, color}, {offset: 1, color}]
                        }())
                    },
                    emphasis: {focus: "series"},
                    data: flat_samples.map(s => (s.processes.get(pid)?.status.VmRSS ?? 0) / 1024 / 1024)
                })
            )
        }

        chart.setOption(option)

        // 监听窗口大小变化
        const handleResize = () => chart.resize()
        window.addEventListener("resize", handleResize)
        return () => {
            window.removeEventListener("resize", handleResize)
            chart.dispose()
        }
    }, [flat_samples, procTreeSamples, show])

    return <div ref={chartRef} style={{width: "100%", height: "400px"}} />
}
