// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title RovifyTicketNFT
 * @dev NFT ticketing system for Rovify events on Base blockchain
 */
contract RovifyTicketNFT is 
    ERC721URIStorage, 
    ERC721Enumerable, 
    Ownable, 
    ReentrancyGuard,
    Pausable 
{
    using Counters for Counters.Counter;
    
    // ============================================
    // STATE VARIABLES
    // ============================================
    
    Counters.Counter private _tokenIds;
    Counters.Counter private _eventIds;
    
    uint256 public constant PLATFORM_FEE = 250; // 2.5% in basis points
    uint256 public constant MAX_ROYALTY_FEE = 1000; // 10% max royalty
    
    address public platformWallet;
    
    // ============================================
    // STRUCTS
    // ============================================
    
    struct Event {
        uint256 eventId;
        string name;
        string metadataURI;
        uint256 startDate;
        uint256 endDate;
        address organizer;
        uint256 ticketPrice;
        uint256 maxTickets;
        uint256 ticketsSold;
        uint256 royaltyFee; // Basis points (e.g., 500 = 5%)
        bool active;
        bool refundable;
        uint256 refundDeadline;
    }
    
    struct Ticket {
        uint256 eventId;
        string ticketType; // VIP, GENERAL, EARLY_BIRD, etc.
        uint256 purchasePrice;
        uint256 purchaseDate;
        bool used;
        bool transferable;
        address originalPurchaser;
    }
    
    struct TicketType {
        string name;
        uint256 price;
        uint256 maxSupply;
        uint256 currentSupply;
        string perks;
    }
    
    // ============================================
    // MAPPINGS
    // ============================================
    
    mapping(uint256 => Event) public events;
    mapping(uint256 => Ticket) public tickets;
    mapping(uint256 => uint256[]) public eventTickets;
    mapping(uint256 => mapping(string => TicketType)) public eventTicketTypes;
    mapping(uint256 => string[]) public eventTicketTypeNames;
    mapping(address => uint256[]) public userEvents; // Events created by user
    mapping(address => uint256[]) public userTickets; // Tickets owned by user
    mapping(uint256 => mapping(address => uint256)) public eventPurchaseCount; // Tickets purchased per user per event
    
    // Secondary market
    mapping(uint256 => uint256) public ticketListingPrice;
    mapping(uint256 => bool) public ticketIsListed;
    
    // ============================================
    // EVENTS
    // ============================================
    
    event EventCreated(
        uint256 indexed eventId, 
        string name, 
        address indexed organizer,
        uint256 maxTickets
    );
    
    event TicketMinted(
        uint256 indexed tokenId, 
        uint256 indexed eventId, 
        address indexed buyer,
        string ticketType
    );
    
    event TicketUsed(uint256 indexed tokenId, uint256 timestamp);
    event TicketTransferred(uint256 indexed tokenId, address from, address to);
    event TicketListed(uint256 indexed tokenId, uint256 price);
    event TicketDelisted(uint256 indexed tokenId);
    event TicketSold(uint256 indexed tokenId, address seller, address buyer, uint256 price);
    event EventCancelled(uint256 indexed eventId);
    event RefundIssued(uint256 indexed tokenId, address indexed recipient, uint256 amount);
    
    // ============================================
    // MODIFIERS
    // ============================================
    
    modifier onlyEventOrganizer(uint256 _eventId) {
        require(events[_eventId].organizer == msg.sender, "Not event organizer");
        _;
    }
    
    modifier onlyTicketOwner(uint256 _tokenId) {
        require(ownerOf(_tokenId) == msg.sender, "Not ticket owner");
        _;
    }
    
    modifier eventExists(uint256 _eventId) {
        require(events[_eventId].eventId != 0, "Event does not exist");
        _;
    }
    
    modifier eventActive(uint256 _eventId) {
        require(events[_eventId].active, "Event not active");
        require(block.timestamp < events[_eventId].startDate, "Event has started");
        _;
    }
    
    // ============================================
    // CONSTRUCTOR
    // ============================================
    
    constructor(address _platformWallet) ERC721("Rovify Event Ticket", "ROVTKT") {
        platformWallet = _platformWallet;
    }
    
    // ============================================
    // EVENT MANAGEMENT
    // ============================================
    
    function createEvent(
        string memory _name,
        string memory _metadataURI,
        uint256 _startDate,
        uint256 _endDate,
        uint256 _maxTickets,
        uint256 _royaltyFee,
        bool _refundable,
        uint256 _refundDeadline
    ) external whenNotPaused returns (uint256) {
        require(_startDate > block.timestamp, "Start date must be in future");
        require(_endDate > _startDate, "End date must be after start date");
        require(_maxTickets > 0, "Must have at least one ticket");
        require(_royaltyFee <= MAX_ROYALTY_FEE, "Royalty fee too high");
        
        _eventIds.increment();
        uint256 newEventId = _eventIds.current();
        
        events[newEventId] = Event({
            eventId: newEventId,
            name: _name,
            metadataURI: _metadataURI,
            startDate: _startDate,
            endDate: _endDate,
            organizer: msg.sender,
            ticketPrice: 0, // Set when adding ticket types
            maxTickets: _maxTickets,
            ticketsSold: 0,
            royaltyFee: _royaltyFee,
            active: true,
            refundable: _refundable,
            refundDeadline: _refundDeadline
        });
        
        userEvents[msg.sender].push(newEventId);
        
        emit EventCreated(newEventId, _name, msg.sender, _maxTickets);
        
        return newEventId;
    }
    
    function addTicketType(
        uint256 _eventId,
        string memory _typeName,
        uint256 _price,
        uint256 _maxSupply,
        string memory _perks
    ) external onlyEventOrganizer(_eventId) eventExists(_eventId) {
        require(_price > 0, "Price must be greater than 0");
        require(_maxSupply > 0, "Supply must be greater than 0");
        require(
            events[_eventId].ticketsSold + _maxSupply <= events[_eventId].maxTickets,
            "Exceeds max tickets for event"
        );
        
        eventTicketTypes[_eventId][_typeName] = TicketType({
            name: _typeName,
            price: _price,
            maxSupply: _maxSupply,
            currentSupply: 0,
            perks: _perks
        });
        
        eventTicketTypeNames[_eventId].push(_typeName);
    }
    
    function cancelEvent(uint256 _eventId) 
        external 
        onlyEventOrganizer(_eventId) 
        eventExists(_eventId) 
    {
        require(events[_eventId].active, "Event already cancelled");
        events[_eventId].active = false;
        
        emit EventCancelled(_eventId);
    }
    
    // ============================================
    // TICKET MINTING
    // ============================================
    
    function mintTicket(
        uint256 _eventId,
        string memory _ticketType,
        string memory _tokenURI
    ) external payable nonReentrant whenNotPaused eventActive(_eventId) returns (uint256) {
        Event storage evt = events[_eventId];
        TicketType storage tType = eventTicketTypes[_eventId][_ticketType];
        
        require(tType.price > 0, "Invalid ticket type");
        require(msg.value >= tType.price, "Insufficient payment");
        require(tType.currentSupply < tType.maxSupply, "Ticket type sold out");
        require(evt.ticketsSold < evt.maxTickets, "Event sold out");
        
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();
        
        _safeMint(msg.sender, newTokenId);
        _setTokenURI(newTokenId, _tokenURI);
        
        tickets[newTokenId] = Ticket({
            eventId: _eventId,
            ticketType: _ticketType,
            purchasePrice: msg.value,
            purchaseDate: block.timestamp,
            used: false,
            transferable: true,
            originalPurchaser: msg.sender
        });
        
        evt.ticketsSold++;
        tType.currentSupply++;
        eventTickets[_eventId].push(newTokenId);
        userTickets[msg.sender].push(newTokenId);
        eventPurchaseCount[_eventId][msg.sender]++;
        
        // Distribute funds
        uint256 platformFeeAmount = (msg.value * PLATFORM_FEE) / 10000;
        uint256 organizerAmount = msg.value - platformFeeAmount;
        
        payable(platformWallet).transfer(platformFeeAmount);
        payable(evt.organizer).transfer(organizerAmount);
        
        emit TicketMinted(newTokenId, _eventId, msg.sender, _ticketType);
        
        return newTokenId;
    }
    
    function mintBatchTickets(
        uint256 _eventId,
        string memory _ticketType,
        string[] memory _tokenURIs,
        uint256 _quantity
    ) external payable nonReentrant whenNotPaused eventActive(_eventId) {
        require(_quantity > 0 && _quantity <= 10, "Invalid quantity");
        require(_tokenURIs.length == _quantity, "URI count mismatch");
        
        TicketType storage tType = eventTicketTypes[_eventId][_ticketType];
        require(msg.value >= tType.price * _quantity, "Insufficient payment");
        
        for (uint256 i = 0; i < _quantity; i++) {
            // This will revert if any single mint fails
            mintTicket(_eventId, _ticketType, _tokenURIs[i]);
        }
    }
    
    // ============================================
    // TICKET USAGE & VALIDATION
    // ============================================
    
    function useTicket(uint256 _tokenId) 
        external 
        onlyTicketOwner(_tokenId) 
    {
        Ticket storage ticket = tickets[_tokenId];
        require(!ticket.used, "Ticket already used");
        
        Event memory evt = events[ticket.eventId];
        require(block.timestamp >= evt.startDate, "Event not started");
        require(block.timestamp <= evt.endDate, "Event ended");
        
        ticket.used = true;
        
        emit TicketUsed(_tokenId, block.timestamp);
    }
    
    function validateTicket(uint256 _tokenId) 
        external 
        view 
        returns (bool isValid, string memory status) 
    {
        if (!_exists(_tokenId)) {
            return (false, "Ticket does not exist");
        }
        
        Ticket memory ticket = tickets[_tokenId];
        Event memory evt = events[ticket.eventId];
        
        if (ticket.used) {
            return (false, "Ticket already used");
        }
        
        if (!evt.active) {
            return (false, "Event cancelled");
        }
        
        if (block.timestamp < evt.startDate) {
            return (true, "Valid - Event not started");
        }
        
        if (block.timestamp > evt.endDate) {
            return (false, "Event ended");
        }
        
        return (true, "Valid");
    }
    
    // ============================================
    // SECONDARY MARKET
    // ============================================
    
    function listTicket(uint256 _tokenId, uint256 _price) 
        external 
        onlyTicketOwner(_tokenId) 
    {
        require(tickets[_tokenId].transferable, "Ticket not transferable");
        require(_price > 0, "Price must be greater than 0");
        require(!ticketIsListed[_tokenId], "Already listed");
        
        ticketListingPrice[_tokenId] = _price;
        ticketIsListed[_tokenId] = true;
        
        emit TicketListed(_tokenId, _price);
    }
    
    function delistTicket(uint256 _tokenId) 
        external 
        onlyTicketOwner(_tokenId) 
    {
        require(ticketIsListed[_tokenId], "Not listed");
        
        ticketIsListed[_tokenId] = false;
        delete ticketListingPrice[_tokenId];
        
        emit TicketDelisted(_tokenId);
    }
    
    function buyTicket(uint256 _tokenId) 
        external 
        payable 
        nonReentrant 
        whenNotPaused 
    {
        require(ticketIsListed[_tokenId], "Ticket not for sale");
        require(msg.value >= ticketListingPrice[_tokenId], "Insufficient payment");
        
        address seller = ownerOf(_tokenId);
        require(seller != msg.sender, "Cannot buy own ticket");
        
        uint256 salePrice = ticketListingPrice[_tokenId];
        Ticket memory ticket = tickets[_tokenId];
        Event memory evt = events[ticket.eventId];
        
        // Calculate fees
        uint256 royaltyAmount = (salePrice * evt.royaltyFee) / 10000;
        uint256 platformAmount = (salePrice * PLATFORM_FEE) / 10000;
        uint256 sellerAmount = salePrice - royaltyAmount - platformAmount;
        
        // Transfer NFT
        _transfer(seller, msg.sender, _tokenId);
        
        // Update listing status
        ticketIsListed[_tokenId] = false;
        delete ticketListingPrice[_tokenId];
        
        // Update user tickets mapping
        _removeFromArray(userTickets[seller], _tokenId);
        userTickets[msg.sender].push(_tokenId);
        
        // Distribute funds
        payable(seller).transfer(sellerAmount);
        payable(evt.organizer).transfer(royaltyAmount);
        payable(platformWallet).transfer(platformAmount);
        
        // Refund excess payment
        if (msg.value > salePrice) {
            payable(msg.sender).transfer(msg.value - salePrice);
        }
        
        emit TicketSold(_tokenId, seller, msg.sender, salePrice);
    }
    
    // ============================================
    // REFUNDS
    // ============================================
    
    function refundTicket(uint256 _tokenId) 
        external 
        onlyTicketOwner(_tokenId) 
        nonReentrant 
    {
        Ticket memory ticket = tickets[_tokenId];
        Event memory evt = events[ticket.eventId];
        
        require(evt.refundable, "Event non-refundable");
        require(block.timestamp <= evt.refundDeadline, "Refund deadline passed");
        require(!ticket.used, "Ticket already used");
        require(msg.sender == ticket.originalPurchaser, "Only original purchaser can refund");
        
        uint256 refundAmount = ticket.purchasePrice;
        
        // Burn the ticket
        _burn(_tokenId);
        
        // Update mappings
        events[ticket.eventId].ticketsSold--;
        eventTicketTypes[ticket.eventId][ticket.ticketType].currentSupply--;
        _removeFromArray(userTickets[msg.sender], _tokenId);
        
        // Process refund (organizer pays the refund)
        payable(msg.sender).transfer(refundAmount);
        
        emit RefundIssued(_tokenId, msg.sender, refundAmount);
    }
    
    // ============================================
    // TRANSFER CONTROLS
    // ============================================
    
    function setTicketTransferable(uint256 _tokenId, bool _transferable) 
        external 
        onlyTicketOwner(_tokenId) 
    {
        tickets[_tokenId].transferable = _transferable;
    }
    
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override(ERC721, ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
        
        // Check if ticket is transferable (skip for minting)
        if (from != address(0) && to != address(0)) {
            require(tickets[tokenId].transferable, "Ticket not transferable");
            
            // Delist if listed
            if (ticketIsListed[tokenId]) {
                ticketIsListed[tokenId] = false;
                delete ticketListingPrice[tokenId];
                emit TicketDelisted(tokenId);
            }
        }
    }
    
    // ============================================
    // ADMIN FUNCTIONS
    // ============================================
    
    function setPlatformWallet(address _newWallet) external onlyOwner {
        require(_newWallet != address(0), "Invalid address");
        platformWallet = _newWallet;
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    function withdrawPlatformFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        payable(platformWallet).transfer(balance);
    }
    
    // ============================================
    // VIEW FUNCTIONS
    // ============================================
    
    function getEventTickets(uint256 _eventId) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return eventTickets[_eventId];
    }
    
    function getUserEvents(address _user) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return userEvents[_user];
    }
    
    function getUserTickets(address _user) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return userTickets[_user];
    }
    
    function getEventTicketTypes(uint256 _eventId) 
        external 
        view 
        returns (string[] memory) 
    {
        return eventTicketTypeNames[_eventId];
    }
    
    function getTicketTypeInfo(uint256 _eventId, string memory _typeName) 
        external 
        view 
        returns (TicketType memory) 
    {
        return eventTicketTypes[_eventId][_typeName];
    }
    
    // ============================================
    // INTERNAL HELPERS
    // ============================================
    
    function _removeFromArray(uint256[] storage array, uint256 value) private {
        for (uint256 i = 0; i < array.length; i++) {
            if (array[i] == value) {
                array[i] = array[array.length - 1];
                array.pop();
                break;
            }
        }
    }
    
    // ============================================
    // OVERRIDES
    // ============================================
    
    function _burn(uint256 tokenId) 
        internal 
        override(ERC721, ERC721URIStorage) 
    {
        super._burn(tokenId);
        delete tickets[tokenId];
    }
    
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
