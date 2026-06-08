import { FastifyInstance } from 'fastify';
import { authenticate } from '../utils/auth';
import { requireFeature } from '../utils/feature-guard';

export default async function fhirRoutes(fastify: FastifyInstance) {
  // Aplica autenticação e feature flag para todas as rotas deste arquivo
  fastify.addHook('preHandler', authenticate);
  fastify.addHook('preHandler', requireFeature('feature:fhir:core'));
  // Metadados do Conector FHIR R4
  fastify.get('/fhir/metadata', async (request, reply) => {
    return {
      resourceType: "CapabilityStatement",
      status: "active",
      date: new Date().toISOString(),
      publisher: "QualitaOS FHIR Interoperability Node",
      kind: "instance",
      software: {
        name: "QualitaOS FHIR Gateway",
        version: "1.0.0"
      },
      fhirVersion: "4.0.1",
      format: ["application/fhir+json"],
      rest: [{
        mode: "server",
        resource: [
          { type: "Patient", interaction: [{ code: "read" }, { code: "search-type" }] },
          { type: "Observation", interaction: [{ code: "read" }, { code: "search-type" }] },
          { type: "Encounter", interaction: [{ code: "read" }] }
        ]
      }]
    };
  });

  // Mock de recurso Patient FHIR
  fastify.get('/fhir/Patient', async (request, reply) => {
    return {
      resourceType: "Bundle",
      type: "searchset",
      total: 2,
      entry: [
        {
          resource: {
            resourceType: "Patient",
            id: "PT-001",
            active: true,
            name: [{ use: "official", family: "Silva", given: ["João"] }],
            gender: "male",
            birthDate: "1980-05-15",
            managingOrganization: { display: "Hospital Qualita Central" }
          }
        },
        {
          resource: {
            resourceType: "Patient",
            id: "PT-002",
            active: true,
            name: [{ use: "official", family: "Santos", given: ["Maria"] }],
            gender: "female",
            birthDate: "1992-10-20",
            managingOrganization: { display: "Hospital Qualita Central" }
          }
        }
      ]
    };
  });

  // Mock de recurso Observation FHIR (Indicadores clínicos)
  fastify.get('/fhir/Observation', async (request, reply) => {
    return {
      resourceType: "Bundle",
      type: "searchset",
      total: 1,
      entry: [
        {
          resource: {
            resourceType: "Observation",
            id: "OBS-001",
            status: "final",
            category: [{ coding: [{ system: "http://terminology.hl7.org/CodeSystem/observation-category", code: "vital-signs", display: "Vital Signs" }] }],
            code: { coding: [{ system: "http://loinc.org", code: "85353-1", display: "Vital signs, weight, height, head circumference, oxygen saturation and BMI panel" }] },
            subject: { reference: "Patient/PT-001", display: "João Silva" },
            effectiveDateTime: new Date().toISOString(),
            valueQuantity: { value: 98.5, unit: "%", system: "http://unitsofmeasure.org", code: "%" }
          }
        }
      ]
    };
  });
}
