import { describe, expect, it } from "vitest";
import {
  hasBpmnDiagram,
  hasRenderableBpmnDiagram,
  isBpmnComplete,
  mendBpmn,
} from "../registry/default/streamdown-bpmn/bpmn-utils";

const COMPLETE_BPMN = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions
  xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
  id="Definitions_1"
  targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1">
    <bpmn:startEvent id="StartEvent_1" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      <bpmndi:BPMNShape id="Shape_StartEvent_1" bpmnElement="StartEvent_1">
        <dc:Bounds x="100" y="100" width="36" height="36" />
      </bpmndi:BPMNShape>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

const sliceAfter = (value: string, needle: string): string =>
  value.slice(0, value.indexOf(needle) + needle.length);

describe("BPMN streaming helpers", () => {
  it("does not report a diagram while only process semantics are present", () => {
    const processOnly = COMPLETE_BPMN.slice(
      0,
      COMPLETE_BPMN.indexOf("<bpmndi:BPMNDiagram"),
    );

    expect(hasBpmnDiagram(processOnly)).toBe(false);
    expect(hasRenderableBpmnDiagram(processOnly)).toBe(false);
  });

  it("recognizes namespace-independent BPMNDiagram tags", () => {
    expect(hasBpmnDiagram("<custom:BPMNDiagram id='Diagram_1'>")).toBe(true);
  });

  it("waits for complete shape bounds before rendering", () => {
    const planeOnly = sliceAfter(
      COMPLETE_BPMN,
      '<bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">',
    );
    const incompleteBounds = sliceAfter(
      COMPLETE_BPMN,
      '<dc:Bounds x="100" y="100" width="36"',
    );
    const completeBounds = sliceAfter(
      COMPLETE_BPMN,
      '<dc:Bounds x="100" y="100" width="36" height="36" />',
    );

    expect(hasRenderableBpmnDiagram(planeOnly)).toBe(false);
    expect(hasRenderableBpmnDiagram(incompleteBounds)).toBe(false);
    expect(hasRenderableBpmnDiagram(completeBounds)).toBe(true);
  });

  it("recognizes completion only after the closing definitions tag", () => {
    expect(isBpmnComplete(COMPLETE_BPMN)).toBe(true);
    expect(
      isBpmnComplete(COMPLETE_BPMN.replace("</bpmn:definitions>", "")),
    ).toBe(false);
  });

  it("leaves a complete document unchanged", () => {
    expect(mendBpmn(COMPLETE_BPMN)).toBe(COMPLETE_BPMN);
  });

  it("closes all open elements in innermost-first order", () => {
    expect(mendBpmn("<definitions><process><task>")).toBe(
      "<definitions><process><task></task></process></definitions>",
    );
  });

  it("drops a half-written trailing tag", () => {
    expect(mendBpmn('<definitions><process><task id="Tas')).toBe(
      "<definitions><process></process></definitions>",
    );
  });

  it("does not treat greater-than signs in attributes as tag endings", () => {
    expect(mendBpmn('<definitions><task name="A > B">')).toBe(
      '<definitions><task name="A > B"></task></definitions>',
    );
  });

  it("does not add closing tags for self-closing elements", () => {
    expect(mendBpmn("<definitions><task /></definitions>")).toBe(
      "<definitions><task /></definitions>",
    );
  });

  it("drops a truncated comment and closes its parent", () => {
    expect(mendBpmn("<definitions><!-- still streaming")).toBe(
      "<definitions></definitions>",
    );
  });
});
