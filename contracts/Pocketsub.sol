pragma solidity ^0.8.24;

import {ERC4908} from "erc-4908/contracts/ERC4908.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

contract Pocketsub is ERC4908 {
    string DEFAULT_IMAGE_URL = "https://arweave.net/9u0cgTmkSM25PfQpGZ-JzspjOMf4uGFjkvOfKjgQnVY";

    struct Subscription {
        string resourceId;
        string imageURL;
    }

    mapping(address => Subscription[]) public shopSubscriptions;

    constructor() ERC4908("Pocketsub", "PKS") {}

    function setSubscription(
        string calldata resourceId,
        uint256 price,
        uint32 expirationDuration,
        string calldata imageURL
    ) public {
        shopSubscriptions[msg.sender].push(Subscription(resourceId, imageURL));
        setAccess(resourceId, price, expirationDuration);
    }

    struct SubscriptionDetails {
        string resourceId;
        string imageURL;
        uint256 price;
        uint32 expirationDuration;
    }

    function getShopSubscriptions(address shop) public view returns (SubscriptionDetails[] memory) {
        uint256 length = shopSubscriptions[shop].length;
        SubscriptionDetails[] memory subs = new SubscriptionDetails[](length);

        for (uint256 i = 0; i < length; i++) {
            (uint256 price, uint32 expirationDuration) = this.getAccessControl(shop, shopSubscriptions[shop][i].resourceId);
            subs[i] = SubscriptionDetails(shopSubscriptions[shop][i].resourceId, shopSubscriptions[shop][i].imageURL, price, expirationDuration);
        }

        return subs;
    }

    function tokenURI(uint256 id) public view override returns (string memory) {
        string memory jsonPreImage = string.concat(
            string.concat(
                string.concat('{"name": "Test #', Strings.toString(id)),
                '","description":"TBD","external_url":"https://TBD","image":"'
            ),
            string.concat(DEFAULT_IMAGE_URL)
        );

        string memory jsonPostImage = '","attributes":[{"trait_type":"Color","value": "TBD"';
        string memory jsonPostTraits = '}]}';

        return string.concat(
            "data:application/json;utf8,",
            string.concat(
                string.concat(jsonPreImage, jsonPostImage),
                jsonPostTraits
            )
        );
    }
}
