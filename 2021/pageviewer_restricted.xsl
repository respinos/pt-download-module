<?xml version="1.0" encoding="UTF-8" ?>

<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:METS="http://www.loc.gov/METS/"
  xmlns:PREMIS="http://www.loc.gov/standards/premis"
  xmlns:exsl="http://exslt.org/common"
  exclude-result-prefixes="exsl str"
  extension-element-prefixes="str exsl" xmlns:str="http://exslt.org/strings">

  <xsl:variable name="gExclusiveAccessFail">
    <xsl:choose>
      <!-- $gHathiTrustAffiliate='true' or $gIsInLibrary='YES' -->
      <xsl:when test="$gRightsAttribute='3' and ($gIsInLibrary='YES') and $gBrittleHeld='YES'">
        <xsl:value-of select="'YES'"/>
      </xsl:when>
      <xsl:otherwise>
        <xsl:value-of select="'NO'"/>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:variable>

  <xsl:template name="setup-extra-header-extra">
    <xsl:call-template name="build-css-link">
      <xsl:with-param name="href" select="'/pt/alicorn/css/search.css'" />
    </xsl:call-template>
    <!-- <link rel="stylesheet" href="/pt/alicorn/css/search.css?_{//Timestamp}" /> -->
  </xsl:template>

  <xsl:template name="setup-body-class">
    <xsl:text> view-restricted</xsl:text>
  </xsl:template>

  <xsl:template name="contents">
    <main class="main-container" id="main">
      <div class="container container-medium flex-container container-boxed" style="margin-top: 1.75rem; margin-bottom: 1.75rem">
        <div class="sidebar-container" id="sidebar" tabindex="0"><xsl:call-template name="sidebar" /></div>
        <section class="section-container" id="section">
          <xsl:call-template name="main" />
        </section>
      </div>
    </main>
  </xsl:template>

  <xsl:template name="main">
    <!-- <main id="main" tabindex="0"> -->
      <h2 class="offscreen">Individual Page (Not Available)</h2>
      <xsl:call-template name="Viewport">
        <xsl:with-param name="pAccessStatus" select="$gFinalAccessStatus"/>
      </xsl:call-template>
    <!-- </main> -->
  </xsl:template>

  <!-- Orphans -->
  <xsl:template name="OrphanCandidatePage">
    <xsl:variable name="copyright_restricted_msg">
      <i class="icomoon icomoon-locked"></i> 
      Full view is not available for this item due to copyright &#169; restrictions.
    </xsl:variable>

    <xsl:variable name="orphan_canditate_msg">
      <strong>This volume is an Orphan Works candidate.</strong> <ul><li>The Orphan Works Project is a framework for libraries to determine whether books in their collections are subject to copyright but whose copyright holders cannot be identified or contacted.</li><li>If you are a bona fide copyright holder of this volume, please contact us at the
      <a title="Orphan Works Project" href="https://www.lib.umich.edu/orphan-works/copyright-holders-we-want-hear-you"> Orphan Works Project.</a></li></ul>
    </xsl:variable>

    <div class="alert alert-info alert-block">
      <p>
        <!-- <img style="float: left; padding-left: 8px" src="//common-web/graphics/LimitedLink.png" alt="" /> -->
        <xsl:copy-of select="$copyright_restricted_msg" />
      </p>
    </div>

    <p>
      <xsl:copy-of select="$orphan_canditate_msg" />
    </p>

  </xsl:template>

  <!-- emergency access user -->
  <xsl:template name="EmergencyAccessAffiliatePage">
    <xsl:variable name="access-type" select="//AccessType" />
    <xsl:choose>
      <xsl:when test="//AccessType/Available = 'TRUE'">

        <!-- item is available for checkout -->
        <div class="alert alert-block alert--emergency-access">
          <p style="margin-right: 1rem">
            <xsl:text>Access to this work is provided through the </xsl:text>
            <a href="{$etas_href}">Emergency Temporary Access Service</a>
            <xsl:text>.</xsl:text>
          </p>
          <div class="alert--emergency-access--options">
            <a class="btn btn-default" style="white-space: nowrap" href="{$access-type/Action}">Check Out</a>
          </div>
        </div>

      </xsl:when>
      <xsl:otherwise>
        <div class="alert alert-block alert-block alert--emergency-access">      
          <p style="margin-right: 1rem">
            <xsl:text>All available copies are currently in use. Try again later. Access to this work is provided through the </xsl:text>
            <a href="{$etas_href}">Emergency Temporary Access Service</a>
            <xsl:text>.</xsl:text>
          </p>

          <!-- <p>Another user is currently viewing this item. It will be available for viewing again: <strong><xsl:value-of select="/MBooksTop/MdpApp/Section108/Expires"/></strong></p> -->
        </div>
      </xsl:otherwise>
    </xsl:choose>

    <div style="margin-bottom: 2rem;">
      <xsl:call-template name="action-search-volume" />
    </div>

    <div>
      <p>
        <xsl:choose>
          <xsl:when test="//AccessType/Available = 'TRUE'">
            <xsl:text>You can </xsl:text>
          </xsl:when>
          <xsl:otherwise>
            <xsl:text>In the meantime, you can </xsl:text>
          </xsl:otherwise>
        </xsl:choose>
        <strong>search in this text</strong><xsl:text> to see if it contains what you are looking for.</xsl:text>
      </p>
      <p>Information about use can be found in the <a href="https://www.hathitrust.org/access_use#ic-access">HathiTrust Access and Use Policy</a>.</p>
    </div>
  </xsl:template>

  <!-- in-library user -->
  <xsl:template name="InLibraryUserPage">
    <xsl:variable name="access-type" select="//AccessType" />
    <xsl:choose>
      <xsl:when test="//AccessType/Available = 'TRUE'">

        <!-- item is available for checkout -->
        <div class="alert alert-block alert--emergency-access">
          <div>
            <p style="margin-right: 1rem;">This work may be in copyright.</p>
            <p style="margin-right: 1rem">

              <xsl:text>Access to this work is provided based on your affiliation or account privileges. </xsl:text>
              <xsl:text>Information about use can be found in the </xsl:text>
              <a href="https://www.hathitrust.org/access_use#ic">HathiTrust Access and Use Policy</a>
              <xsl:text>.</xsl:text>
            </p>
          </div>
          <div class="alert--emergency-access--options">
            <a class="btn btn-default" style="white-space: nowrap" href="{$access-type/Action}">Check Out</a>
          </div>
        </div>

      </xsl:when>
      <xsl:otherwise>
        <div class="alert alert-block alert-info">      
          <p><strong>This work is in copyright.</strong> Full view access is available for this item based on your affiliation or account privileges. Items made available under these special circumstances can only be accessed by one user at a time.</p>

          <p>All available copies are currently in use. Try again later.</p>

          <!-- <p>Another user is currently viewing this item. It will be available for viewing again: <strong><xsl:value-of select="/MBooksTop/MdpApp/Section108/Expires"/></strong></p> -->
        </div>
      </xsl:otherwise>
    </xsl:choose>

    <div style="margin-bottom: 2rem;">
      <xsl:call-template name="action-search-volume" />
    </div>

    <div>
      <p>
        <xsl:choose>
          <xsl:when test="//AccessType/Available = 'TRUE'">
            <xsl:text>You can </xsl:text>
          </xsl:when>
          <xsl:otherwise>
            <xsl:text>In the meantime, you can </xsl:text>
          </xsl:otherwise>
        </xsl:choose>
        <strong>search in this text</strong><xsl:text> to see if it contains what you are looking for.</xsl:text>
      </p>
      <p>Information about use can be found in the <a href="https://www.hathitrust.org/access_use#ic-access">HathiTrust Access and Use Policy</a>.</p>
    </div>
  </xsl:template>

  <!-- Brittle access -->
  <xsl:template name="BrittleAccessPage">
    <div class="alert alert-block alert-info">      
      <p><strong>This work is in copyright.</strong> Full view access is available for this item based on your affiliation or account privileges. Items made available under these special circumstances can only be accessed by one user at a time, in 24 hour increments.</p>

      <p>Another user is currently viewing this item. It will be available for viewing again: <strong><xsl:value-of select="/MBooksTop/MdpApp/Section108/Expires"/></strong></p>
    </div>

    <div style="margin-bottom: 2rem;">
      <xsl:call-template name="action-search-volume" />
    </div>

    <div>
      <p>
        <xsl:text>In the meantime, you can </xsl:text>
        <strong>search in this text</strong><xsl:text> to see if it contains what you are looking for.</xsl:text>
      </p>
      <p>Information about use can be found in the <a href="https://www.hathitrust.org/access_use#ic-access">HathiTrust Access and Use Policy</a>.</p>
    </div>
  </xsl:template>
  
  <!-- Deleted item -->
  <xsl:template name="DeletedItemPage">
    <div class="alert alert-info alert-block">
      <p>This item is <strong>no longer available</strong> in HathiTrust due to one of the following reasons:</p>
    </div>

    <ul class="bullets">
      <li>It was deleted at the request of the rights holder or has been marked for deletion.</li>
      <li>It was either wholly unusable or a superior copy is available.</li>
    </ul>
      
    <p>
      <xsl:text>Try a </xsl:text>
      <xsl:element name="a">
        <xsl:attribute name="style">font-weight: bold;</xsl:attribute>
        <xsl:attribute name="href">
          <xsl:value-of select="'https://www.hathitrust.org'"/>
        </xsl:attribute>
        <xsl:text>new search</xsl:text>
      </xsl:element>
      <xsl:text> for your item to see if there are other copies or editions of this work available.</xsl:text>
    </p>
  </xsl:template>

  <!-- No access due to copyright restrictions -->
  <xsl:template name="NoAccessPage">
    <xsl:variable name="find-in-library-link">
      <xsl:call-template name="FindInALibraryLink">
        <xsl:with-param name="class"> inline</xsl:with-param>
        <xsl:with-param name="label">find this item in a library</xsl:with-param>
      </xsl:call-template>
    </xsl:variable>
    <div class="alert alert-info alert-block">
      This item is <strong>not available online</strong> (<i class="icomoon icomoon-locked"></i> Limited - search only) due to copyright restrictions. <a href="https://www.hathitrust.org/help_copyright#RestrictedAccess">Learn More »</a>
    </div>

    <div style="margin-bottom: 2rem;">
      <xsl:call-template name="action-search-volume" />
    </div>

    <div>
      <p>
        <xsl:text>You can </xsl:text>
        <xsl:if test="exsl:node-set($find-in-library-link)//node()">
          <xsl:text>try to </xsl:text>
          <xsl:apply-templates select="exsl:node-set($find-in-library-link)" mode="copy" />
          <xsl:text> or </xsl:text>
        </xsl:if>
        <strong>search in this text</strong><xsl:text> to find the frequency and page number of specific words and phrases. This can be especially useful to help you decide if the book is worth buying, checking out from a library, etc.</xsl:text>
      </p>
      <!-- <xsl:call-template name="build-results-example-as-text" /> -->
    </div>
  </xsl:template>

  <!-- No access due to pd-pvt (private) -->
  <xsl:template name="PrivateItemPage">
    <xsl:variable name="find-in-library-link">
      <xsl:call-template name="FindInALibraryLink">
        <xsl:with-param name="class"> inline</xsl:with-param>
        <xsl:with-param name="label">find this item in a library</xsl:with-param>
      </xsl:call-template>
    </xsl:variable>
    <div class="alert alert-info alert-block">
      We have determined this work to be in the public domain, but access is limited due to privacy concerns. See HathiTrust's <a href="https://www.hathitrust.org/privacy#pd-pvt">Privacy Policy</a> for more information.
    </div>
    <div style="margin-bottom: 2rem;">
      <xsl:call-template name="action-search-volume" />
    </div>

    <div>
      <p>
        <xsl:text>You can </xsl:text>
        <xsl:if test="exsl:node-set($find-in-library-link)//node()">
          <xsl:text>try to </xsl:text>
          <xsl:apply-templates select="exsl:node-set($find-in-library-link)" mode="copy" />
          <xsl:text> or </xsl:text>
        </xsl:if>
        <strong>search in this text</strong><xsl:text> to find the frequency and page number of specific words and phrases. This can be especially useful to help you decide if the book is worth buying, checking out from a library, etc.</xsl:text>
      </p>
    </div>
    <!-- <xsl:call-template name="build-results-example-as-img" /> -->
  </xsl:template>

  <xsl:template name="build-results-example-as-text">
    <h3 style="margin-top: 1rem">Example</h3>
    <figure>
      <div style="padding: 1rem; border-left: 1px solid #ccc; border-right: 1px solid #ccc; width: 90%; transform: scale(0.9)" class="content-box">
        <div class="alert alert-info alert-block">
          <p>Showing 1 - 10 of  Results for <span class="mdpEmp">elephant</span></p>
        </div>
        <article class="result"><h3 class="results-header"><a href="#" disabled="disabled">Page 8</a>&#160;-&#160;25&#160;matching terms</h3></article>
        <article class="result"><h3 class="results-header"><a href="#" disabled="disabled">Page 3</a>&#160;-&#160;14&#160;matching terms</h3></article>
        <article class="result"><h3 class="results-header"><a href="#" disabled="disabled">Page 12</a>&#160;-&#160;16&#160;matching terms</h3></article>
        <article class="result"><h3 class="results-header"><a href="#" disabled="disabled">Page 297</a>&#160;-&#160;4&#160;matching terms</h3></article>
      </div>
      <figcaption>
        Example of the information returned when searching <strong><i class="icomoon icomoon-lock" aria-hidden="true"></i> Limited - search only</strong> books.
      </figcaption>
    </figure>
  </xsl:template>

  <xsl:template name="build-results-example-as-img">
    <p>
      <em>Example:</em>
      <br />
      <img src="//common-web/graphics/LimitedSample.png" alt="Search results showing page numbers and frequency counts." />
    </p>
  </xsl:template>

  <!-- VIEWING AREA -->

  <xsl:template name="Viewport">
    <xsl:param name="pCurrentPageImageSource"/>
    <xsl:param name="pCurrentPageOcr"/>
    <xsl:param name="pAccessStatus"/>

    <xsl:element name="div">
      <xsl:attribute name="id">mdpTextDeny</xsl:attribute>
      <xsl:choose>
        <!-- TOMBSTONE -->
        <xsl:when test="$gRightsAttribute='8'">
          <xsl:call-template name="DeletedItemPage"/>
        </xsl:when>

        <!-- PD-PVT (PRIVATE) -->
        <xsl:when test="$gRightsAttribute='26'">
          <xsl:call-template name="PrivateItemPage" />
        </xsl:when>

        <!-- Brittle message about when current accessor's exclusive access expires -->
        <xsl:when test="false() and $gExclusiveAccessFail='YES'">
          <xsl:call-template name="BrittleAccessPage"/>
        </xsl:when>

        <xsl:when test="$gBrittleHeld = 'YES' and //AccessType/Name = 'in_library_user'">
          <xsl:call-template name="InLibraryUserPage" />
        </xsl:when>

        <xsl:when test="$gHeld = 'YES' and //AccessType/Name = 'emergency_access_affiliate'">
          <xsl:call-template name="EmergencyAccessAffiliatePage" />
        </xsl:when>

        <!-- orphan message -->
        <xsl:when test="$gOrphanCandidate='true'">
          <xsl:call-template name="OrphanCandidatePage"/>
        </xsl:when>

        <!-- In copyright, no access message -->
        <xsl:otherwise>
          <xsl:call-template name="NoAccessPage"/>
        </xsl:otherwise>
      </xsl:choose>
    </xsl:element>
    
  </xsl:template>

</xsl:stylesheet>

