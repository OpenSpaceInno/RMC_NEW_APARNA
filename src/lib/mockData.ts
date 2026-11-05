import { ANPREvent, CameraFeed } from "@/types/anpr";

export const mockCameras: CameraFeed[] = [
  {
    id: "cam_gate_1",
    name: "Gate Entry - ANPR",
    location: "Main Gate",
    status: "online",
  },
  {
    id: "cam_gate_2",
    name: "Gate Entry - Side View",
    location: "Main Gate",
    status: "online",
  },
];

export const mockANPREvents: ANPREvent[] = [
  {
    eventId: "evt_ANPR_0001",
    type: "ANPR_READ",
    timestamp: new Date().toISOString(),
    plantId: "plant_001",
    cameraId: "cam_gate_1",
    vehicleRegNo: "KA05AB1234",
    confidence: 0.961,
    source: "edge-anpr-01",
    evidence: [
      {
        type: "image",
        url: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800&h=600&fit=crop",
        angle: "front",
        timestamp: new Date().toISOString(),
        thumbnailUrl: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=200&h=150&fit=crop",
      },
      {
        type: "image",
        url: "https://images.unsplash.com/photo-1486496146582-9ffcd0b2b2b7?w=800&h=600&fit=crop",
        angle: "plate",
        timestamp: new Date().toISOString(),
        thumbnailUrl: "https://images.unsplash.com/photo-1486496146582-9ffcd0b2b2b7?w=200&h=150&fit=crop",
      },
      {
        type: "image",
        url: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&h=600&fit=crop",
        angle: "side",
        timestamp: new Date().toISOString(),
        thumbnailUrl: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=200&h=150&fit=crop",
      },
    ],
    status: "pending",
  },
];

// Generate random plate number
export const generateRandomPlate = (): string => {
  const states = ["KA", "MH", "TN", "DL", "GJ"];
  const state = states[Math.floor(Math.random() * states.length)];
  const num1 = Math.floor(Math.random() * 99) + 1;
  const letters = String.fromCharCode(65 + Math.floor(Math.random() * 26)) + 
                  String.fromCharCode(65 + Math.floor(Math.random() * 26));
  const num2 = Math.floor(Math.random() * 9999) + 1;
  return `${state}${num1.toString().padStart(2, '0')}${letters}${num2.toString().padStart(4, '0')}`;
};

// Generate random confidence between 0.85 and 0.99
export const generateRandomConfidence = (): number => {
  return Math.random() * (0.99 - 0.85) + 0.85;
};
