pragma solidity ^0.8.24;

import {ERC4908} from "erc-4908/contracts/ERC4908.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";


contract Pocketsub is ERC4908, ReentrancyGuard {
    string DEFAULT_IMAGE_URL = "https://arweave.net/9u0cgTmkSM25PfQpGZ-JzspjOMf4uGFjkvOfKjgQnVY";

    struct Subscription {
        string resourceId;
        string imageURL;
    }

    struct Deal {
        address shop;
        string imageURL;
        uint256 price;
    }

    mapping(address => Subscription[]) public shopSubscriptions;
    mapping(uint256 => Deal) public dealInfo;

    constructor() ERC4908("Pocketsub", "PKS") {}

    function mint(
        address shop,
        string calldata resourceId,
        address to
    ) public payable override nonReentrant {
        super.mint(shop, resourceId, to);

        uint256 length = shopSubscriptions[shop].length;
        string memory imageURL = "";
        for (uint256 i = 0; i < length; i++) {
            if (keccak256(abi.encodePacked(shopSubscriptions[shop][i].resourceId)) 
                    == keccak256(abi.encodePacked(resourceId))) {
                imageURL = shopSubscriptions[shop][i].imageURL;
                break;
            }
        }

        dealInfo[totalSupply() - 1] = Deal(shop, imageURL, msg.value);
    }

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
                string.concat('{"name": "', nftData[id].resourceId),
                '","description":"What you are looking at is a NFT subscription.","external_url":"https://pocketsub.io/0x90d87CfCeF0d8058BfDb2862C00B5525556253F2","image":"'
            ),
            dealInfo[id].imageURL
        );

        string memory jsonPostImage = string.concat(
            '","attributes":[{"display_type": "date", "trait_type": "Expiration date","value": ', 
            Strings.toString(nftData[id].expirationTime)
        );
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
