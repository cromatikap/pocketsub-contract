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

    function deleteSubscription(string calldata resourceId) public {
        Subscription[] storage subscriptions = shopSubscriptions[msg.sender];
        uint256 length = subscriptions.length;

        for (uint256 i = 0; i < length; i++) {
            if (keccak256(abi.encodePacked(subscriptions[i].resourceId)) 
                    == keccak256(abi.encodePacked(resourceId))) {
                subscriptions[i] = subscriptions[length - 1];
                subscriptions.pop();
                break;
            }
        }

        delAccess(resourceId);
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
            (uint256 price, uint32 expirationDuration) = this.getAccessControl(
                shop, 
                shopSubscriptions[shop][i].resourceId
            );

            subs[i] = SubscriptionDetails(
                shopSubscriptions[shop][i].resourceId,
                shopSubscriptions[shop][i].imageURL,
                price,
                expirationDuration
            );
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

        string memory jsonPostImage = '","attributes":[{"display_type": "date", "trait_type":"Expiration date","value": 1546360800';
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
