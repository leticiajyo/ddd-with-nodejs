import EventInterface from "../../../@shared/event/event.interface";
import Address from "../../value-object/address";

interface EventData {
    id: string,
    name: string,
    address: Address
}
export default class CustomerAddressChangedEvent implements EventInterface {
    dataTimeOccurred: Date;
    eventData: EventData;

    constructor(eventData: EventData) {
        this.dataTimeOccurred = new Date();
        this.eventData = eventData;
    }
}
