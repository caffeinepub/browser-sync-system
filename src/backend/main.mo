import Map "mo:core/Map";
import Text "mo:core/Text";
import Runtime "mo:core/Runtime";
import Float "mo:core/Float";
import Order "mo:core/Order";
import Array "mo:core/Array";

actor {
  type SessionId = Text;
  type ClientId = Nat;
  type ClientSyncState = {
    position : Cursor;
    url : Text;
    syncEnabled : Bool;
  };

  let sessions = Map.empty<SessionId, BrowserSyncSession>();

  type Cursor = {
    x : Float;
    y : Float;
  };

  module Cursor {
    public func compare(cursor1 : Cursor, cursor2 : Cursor) : Order.Order {
      if (cursor1.x == cursor2.x and cursor1.y == cursor2.y) {
        #equal;
      } else if (cursor1.x < cursor2.x or (cursor1.x == cursor2.x and cursor1.y < cursor2.y)) {
        #less;
      } else {
        #greater;
      };
    };
  };

  type BrowserSyncSession = {
    master : ClientSyncState;
    masterConnected : Bool;
    clients : [ClientId];
    lastModified : Int;
  };

  module BrowserSyncSession {
    public func addClient(session : BrowserSyncSession, clientId : ClientId) : BrowserSyncSession {
      let newClients = session.clients.concat([clientId]);
      {
        master = session.master;
        masterConnected = session.masterConnected;
        clients = newClients;
        lastModified = session.lastModified;
      };
    };

    public func removeClient(session : BrowserSyncSession, clientId : ClientId) : BrowserSyncSession {
      let newClients = session.clients.filter(func(c) { c != clientId });
      {
        master = session.master;
        masterConnected = session.masterConnected;
        clients = newClients;
        lastModified = session.lastModified;
      };
    };
  };

  // SESSION MANAGEMENT

  public shared ({ caller }) func createSession() : async Text {
    let sessionId = getUniqueSessionId();
    let newSession : BrowserSyncSession = {
      master = {
        position = { x = 0.0; y = 0.0 };
        url = "";
        syncEnabled = false;
      };
      masterConnected = true;
      clients = [];
      lastModified = 0;
    };
    sessions.add(sessionId, newSession);
    sessionId;
  };

  public shared ({ caller }) func joinSession(sessionId : Text) : async ClientId {
    switch (sessions.get(sessionId)) {
      case (null) { Runtime.trap("Session does not exist") };
      case (?session) {
        if (session.clients.size() < 5) {
          let clientId = session.clients.size() + 1;
          let updatedSession = BrowserSyncSession.addClient(session, clientId);
          sessions.add(sessionId, updatedSession);
          clientId;
        } else {
          Runtime.trap("Session is full");
        };
      };
    };
  };

  public shared ({ caller }) func disconnectClient(sessionId : Text, clientId : ClientId) : async () {
    switch (sessions.get(sessionId)) {
      case (null) { Runtime.trap("Session does not exist") };
      case (?session) {
        if (clientId > 0 and clientId < 6) {
          let updatedSession = BrowserSyncSession.removeClient(session, clientId);
          sessions.add(sessionId, updatedSession);
        } else {
          Runtime.trap("Invalid clientId");
        };
      };
    };
  };

  // SYNCE STATE MANAGEMENT

  public shared ({ caller }) func updateSyncState(sessionId : Text, url : Text, position : Cursor, syncEnabled : Bool) : async () {
    switch (sessions.get(sessionId)) {
      case (null) { Runtime.trap("Session does not exist") };
      case (?session) {
        let updatedMasterState : ClientSyncState = {
          url;
          position;
          syncEnabled;
        };
        let updatedSession : BrowserSyncSession = {
          master = updatedMasterState;
          masterConnected = true;
          clients = session.clients;
          lastModified = 0;
        };
        sessions.add(sessionId, updatedSession);
      };
    };
  };

  // QUERIES

  public query ({ caller }) func getSyncState(sessionId : Text) : async {
    master : ClientSyncState;
    clientCount : Nat;
  } {
    switch (sessions.get(sessionId)) {
      case (null) { Runtime.trap("Session does not exist") };
      case (?session) {
        {
          master = session.master;
          clientCount = session.clients.size();
        };
      };
    };
  };

  public query ({ caller }) func getSessionInfo(sessionId : Text) : async {
    exists : Bool;
    masterConnected : Bool;
    clientCount : Nat;
  } {
    switch (sessions.get(sessionId)) {
      case (null) {
        {
          exists = false;
          masterConnected = false;
          clientCount = 0;
        };
      };
      case (?session) {
        {
          exists = true;
          masterConnected = session.masterConnected;
          clientCount = session.clients.size();
        };
      };
    };
  };

  public query ({ caller }) func getClientCount(sessionId : Text) : async Nat {
    switch (sessions.get(sessionId)) {
      case (null) { 0 };
      case (?session) { session.clients.size() };
    };
  };

  // SUPPORT FUNCTIONS

  // Generate unique 6-character session ID
  func getUniqueSessionId() : Text {
    let chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".toArray();
    var sessionId : Text = "";
    var i = 0;
    while (i < 6) {
      let randomIndex = i % chars.size();
      sessionId #= chars[randomIndex].toText();
      i += 1;
    };
    sessionId;
  };
};
