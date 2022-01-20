App = {
  web3Provider: null,
  contracts: {},
  petsJson: [],

  init: async function() {
    // Load pets.
    if (App.petsJson.length == 0) {
    $.getJSON('../pets.json', function(data) {
      petsJson = data;
      App.setAdoptionView(data);
    });
  } else {
    App.setAdoptionView(App.petsJson);

  }

    return await App.initWeb3();
  },

  initWeb3: async function() {
    // Modern dapp browsers...
    if (window.ethereum) {
      App.web3Provider = window.ethereum;
      try {
        // Request account access
        await window.ethereum.request({ method: "eth_requestAccounts" });;
      } catch (error) {
        // User denied account access...
        console.error("User denied account access")
      }
    }
    // Legacy dapp browsers...
    else if (window.web3) {
      App.web3Provider = window.web3.currentProvider;
    }
    // If no injected web3 instance is detected, fall back to Ganache
    else {
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
    }
    web3 = new Web3(App.web3Provider);

    return App.initContract();
  },

  initContract: function() {
    $.getJSON('Adoption.json', function(data) {
      // Get the necessary contract artifact file and instantiate it with @truffle/contract
      var AdoptionArtifact = data;
      App.contracts.Adoption = TruffleContract(AdoptionArtifact);
    
      // Set the provider for our contract
      App.contracts.Adoption.setProvider(App.web3Provider);
    
      // Use our contract to retrieve and mark the adopted pets
      return App.markAdopted();
    });

    return App.bindEvents();
  },

  bindEvents: function() {
    $(document).on('click', '.btn-adopt', App.handleAdopt);
    $(document).on('click', '.btn-return', App.handleReturn);
  },

  markAdopted: function() {
    var adoptionInstance;

    App.contracts.Adoption.deployed().then(function(instance) {
      adoptionInstance = instance;

      return adoptionInstance.getAdopters.call();
    }).then(function(adopters) {
      for (i = 0; i < adopters.length; i++) {
        console.log(adopters[i])
        if (adopters[i] !== '0x0000000000000000000000000000000000000000' && adopters[i] !== '0x') {
          $('.panel-pet').eq(i).find('button').text('Already Adopted').attr('disabled', true);
        }
      }
    }).catch(function(err) {
      console.log(err.message);
    });
  },

  getYourPets: function() {
    var adoptionInstance;

    App.contracts.Adoption.deployed().then(function(instance) {
      adoptionInstance = instance;

      return adoptionInstance.getAdopters.call();
    }).then(function(adopters) {
      var hasPet = false;
      var petsRow = $('#yourPetsRow');
      for (i = 0; i < adopters.length; i++) {
        if (adopters[i] !== '0x0000000000000000000000000000000000000000' && adopters[i] !== '0x') {
          hasPet = true;
          var petTemplate = $('#petTemplate');
      
          petTemplate.find('.panel-title').text(petsJson[i].name);
          petTemplate.find('img').attr('src', petsJson[i].picture);
          petTemplate.find('.pet-breed').text(petsJson[i].breed);
          petTemplate.find('.pet-age').text(petsJson[i].age);
          petTemplate.find('.pet-location').text(petsJson[i].location);
          petTemplate.find('.btn-return').show()
          petTemplate.find('.btn-return').attr('data-id', petsJson[i].id);
          petTemplate.find('.btn-adopt').hide();
    
          petsRow.append(petTemplate.html());
        }
      }
      if (!hasPet) {
        var petsRow = $('#yourPetsRow');
        petsRow.append("<b>You don't have any pets yet! Go back and adopt you jerk.</b>");
      }
    }).catch(function(err) {
      console.log(err.message);
    });
  },

  setAdoptionView: function(data) {
    var petsRow = $('#petsRow');
    var petTemplate = $('#petTemplate');

    for (i = 0; i < data.length; i ++) {
      petTemplate.find('.panel-title').text(data[i].name);
      petTemplate.find('img').attr('src', data[i].picture);
      petTemplate.find('.pet-breed').text(data[i].breed);
      petTemplate.find('.pet-age').text(data[i].age);
      petTemplate.find('.pet-location').text(data[i].location);
      petTemplate.find('.btn-adopt').show()
      petTemplate.find('.btn-adopt').attr('data-id', data[i].id);
      petTemplate.find('.btn-return').hide();

      petsRow.append(petTemplate.html());
    }
  },


  handleAdopt: function(event) {
    event.preventDefault();

    var petId = parseInt($(event.target).data('id'));

    var adoptionInstance;

    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }
      var account = accounts[0];

      App.contracts.Adoption.deployed().then(function(instance) {
        adoptionInstance = instance;
        // Execute adopt as a transaction by sending account
        return adoptionInstance.adopt(petId, {from: account});
      }).then(function(result) {
        return App.markAdopted();
      }).catch(function(err) {
        console.log(err.message);
      });
    });
  },

  handleReturn: function(event) {
    event.preventDefault();

    var petId = parseInt($(event.target).data('id'));

    var adoptionInstance;

    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }
      var account = accounts[0];

      App.contracts.Adoption.deployed().then(function(instance) {
        adoptionInstance = instance;
        // Execute adopt as a transaction by sending account
        return adoptionInstance.handleReturn(petId, {from: account});
      }).then(function(result) {
        App.getYourPets();
      }).catch(function(err) {
        console.log(err.message);
      });
    });
  }
};

$(function() {
  $(window).load(function() {
    App.init();
  });
});

function toPersonalView() {
  resetPage();
  App.getYourPets();
}

function toAdoptionView() {
  resetPage();
  App.setAdoptionView(petsJson);
  App.markAdopted()
}

function resetPage() {
  $("#yourPetsRow").empty();
  $("#petsRow").empty();
}
