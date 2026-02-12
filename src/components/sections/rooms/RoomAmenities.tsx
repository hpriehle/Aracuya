import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { StaggerChildren } from "@/components/animation/StaggerChildren";
import { Room } from "@/types/room";

interface RoomAmenitiesProps {
  room: Room;
}

export function RoomAmenities({ room }: RoomAmenitiesProps) {
  return (
    <section className="py-24 md:py-32">
      <Container>
        <SectionHeading title="Amenities" />

        <StaggerChildren className="mx-auto grid max-w-3xl grid-cols-2 gap-x-8 gap-y-4 md:grid-cols-3">
          {room.amenities.map((amenity) => (
            <div
              key={amenity}
              className="flex items-center gap-3 py-3 border-b border-gray-light"
            >
              <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-green" />
              <span className="font-body text-small text-black">
                {amenity}
              </span>
            </div>
          ))}
        </StaggerChildren>
      </Container>
    </section>
  );
}
